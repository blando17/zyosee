const dotenv = require("dotenv");
dotenv.config();

/*
 * The one place this project talks to Gemini.
 *
 * Both features that use the model, the complexity reading and the coding
 * assistant, go through here. One key, one model setting, one timeout, one set
 * of error codes. A second copy of this would mean a second place to update
 * when Google retires a model name, and they do that regularly.
 *
 * It runs on the server because of the key. A key shipped to the page is a key
 * anyone can read out of the network tab and spend.
 */

const API_ROOT =
  process.env.GEMINI_API_ROOT || "https://generativelanguage.googleapis.com/v1beta/models";

/*
 * A "lite" model, which is the cheap tier and the point of choosing it: neither
 * reading loop nesting nor explaining a failed test needs a reasoning model,
 * and the heavy ones drain a free key fast.
 *
 * Not 2.5. Google has closed that whole family to new API keys and refuses the
 * request outright, naming this as the replacement.
 */
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const REQUEST_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 30000;

class GeminiError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function isConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

// Models answer in LaTeX and markdown when left alone. The prompts ask for
// plain text; this is the belt to those braces.
function clean(value) {
  if (typeof value !== "string") return value;
  return value.replace(/[$`]/g, "").replace(/\s+\n/g, "\n").trim();
}

const BUSY = /high demand|overloaded|try again later|UNAVAILABLE|RESOURCE_EXHAUSTED/i;

async function callOnce({ prompt, schema, maxOutputTokens, temperature }) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new GeminiError(
      "not_configured",
      "No Gemini API key. Add GEMINI_API_KEY to compiler/.env and restart the compiler service."
    );
  }

  // A hosted model can hang. Without this the browser waits until it gives up
  // on its own, with nothing on screen explaining why.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${API_ROOT}/${MODEL}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens,
          responseMimeType: "application/json",
          responseSchema: schema,
          // No thinkingConfig: this model rejects a thinking budget as an
          // invalid argument, so the output cap is what keeps replies small.
        },
      }),
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new GeminiError("timeout", `Gemini did not answer within ${REQUEST_TIMEOUT_MS / 1000}s.`);
    }
    throw new GeminiError("network_error", `Could not reach Gemini: ${err.message}`);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const body = await response.text();
    // Google's error body can echo the URL back with the key in it, so only the
    // message is kept and the rest is dropped.
    let detail = `HTTP ${response.status}`;
    try {
      const parsed = JSON.parse(body);
      if (parsed?.error?.message) detail = parsed.error.message;
    } catch (err) {
      // A non-JSON error body tells us nothing useful; the status stands.
    }

    if (response.status === 400 && /API key not valid/i.test(detail)) {
      throw new GeminiError("bad_key", "Gemini rejected the API key. Check GEMINI_API_KEY.");
    }
    if (response.status === 429 || BUSY.test(detail)) {
      throw new GeminiError("busy", detail);
    }
    throw new GeminiError("api_error", `Gemini refused the request: ${detail}`);
  }

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    const reason = payload?.candidates?.[0]?.finishReason || "no reason given";
    throw new GeminiError("empty_response", `Gemini returned no answer (${reason}).`);
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    // A truncated reply is the usual cause: the model ran into maxOutputTokens
    // mid-object, so the JSON never closed.
    throw new GeminiError("bad_response", "Gemini's answer was not the JSON shape we asked for.");
  }
}

/*
 * Asks for a JSON object matching `schema`.
 *
 * One retry, and only when the model says it is busy. A bad key or a malformed
 * request fails identically the second time, so retrying it would just spend
 * another call against the quota.
 */
async function generateJson({ prompt, schema, maxOutputTokens = 400, temperature = 0.2 }) {
  try {
    return await callOnce({ prompt, schema, maxOutputTokens, temperature });
  } catch (err) {
    if (err.code !== "busy") throw err;
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return callOnce({ prompt, schema, maxOutputTokens, temperature });
  }
}

module.exports = { generateJson, isConfigured, clean, GeminiError, MODEL };
