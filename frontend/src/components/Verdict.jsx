/*
 * How every verdict is named and coloured, in one place, so the compiler page
 * and the judge page never disagree about what "TLE" looks like.
 */

export const VERDICTS = {
  accepted: { label: "Accepted", className: "bg-green-100 text-green-800" },
  success: { label: "Success", className: "bg-green-100 text-green-800" },
  wrong_answer: { label: "Wrong Answer", className: "bg-red-100 text-red-800" },
  compilation_error: { label: "Compilation Error", className: "bg-red-100 text-red-800" },
  runtime_error: { label: "Runtime Error", className: "bg-red-100 text-red-800" },
  time_limit_exceeded: { label: "Time Limit Exceeded", className: "bg-amber-100 text-amber-900" },
  output_limit_exceeded: { label: "Output Limit Exceeded", className: "bg-amber-100 text-amber-900" },
  invalid_request: { label: "Invalid Request", className: "bg-red-100 text-red-800" },
  /*
   * Amber rather than red, and worded as a wait rather than a failure.
   *
   * Nothing is wrong with the code and nothing is wrong with the server: the
   * submission was refused for arriving too soon after the last one. Colouring
   * it like a Runtime Error would send somebody to debug a solution that may
   * well be correct, so it shares the palette with the other "try again"
   * outcome, Time Limit Exceeded.
   */
  rate_limited: { label: "Too Many Submissions", className: "bg-amber-100 text-amber-900" },
  server_error: { label: "Server Error", className: "bg-red-100 text-red-800" },
  skipped: { label: "Not Run", className: "bg-brand-100 text-brand-800" },
  passed: { label: "Passed", className: "bg-green-100 text-green-800" },
  // A case you added yourself: it ran, and since there is no known answer to
  // compare against, the row shows the output instead of a pass or a fail.
  ran: { label: "Output", className: "bg-brand-100 text-brand-800" },
};

// Passed, failed, or neither. Used to pick the tick, the cross, or the dash.
export function outcomeOf(status) {
  if (status === "passed" || status === "accepted" || status === "success") return "pass";
  if (status === "skipped" || status === "ran") return "neutral";
  return "fail";
}

// Never colour alone: the mark sits beside a written status everywhere it is
// used, so the meaning survives for anyone who cannot tell the two hues apart.
export function StatusMark({ status, className = "" }) {
  const outcome = outcomeOf(status);
  const mark = outcome === "pass" ? "\u2713" : outcome === "fail" ? "\u2717" : "\u2013";
  const colour =
    outcome === "pass" ? "text-green-700" : outcome === "fail" ? "text-red-700" : "text-brand-700";
  return (
    <span aria-hidden="true" className={`font-bold ${colour} ${className}`}>
      {mark}
    </span>
  );
}

export function verdictOf(name) {
  return VERDICTS[name] || VERDICTS.server_error;
}

export default function VerdictBadge({ verdict, className = "" }) {
  const style = verdictOf(verdict);
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.className} ${className}`}
    >
      {style.label}
    </span>
  );
}
