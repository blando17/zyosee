import { useEffect, useState } from "react";
import Icon from "../Icon";
import Blocks, { Text } from "./Blocks";
import { DONE, IMPORTANCE, NONE, REVISE, TYPES, UNANSWERED } from "../../corecs/schema";

/*
 * One question, closed or open.
 *
 * THE WHOLE POINT IS THAT THE ANSWER STARTS HIDDEN
 *
 * Revision only works if you try to answer before you look. A card that shows
 * the answer alongside the question is a textbook, not practice — you read it,
 * recognise it, and mistake recognition for recall. So the answer is behind a
 * reveal, and the two buttons that follow it are the only way to move on.
 *
 * WHY THE SHORT ANSWER IS SEPARATE FROM THE FULL ONE
 *
 * Two days before an interview you want the one-line version; two weeks before
 * you want the explanation. Rather than making that a setting, the short
 * answer appears first, in the accent colour, and the detail runs underneath.
 * Scanning stops at the first line; studying carries on.
 */

const MARK_STYLE = {
  [DONE]: "border-emerald-400 bg-emerald-50 text-emerald-800",
  [REVISE]: "border-amber-400 bg-amber-50 text-amber-800",
};

function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold
                  uppercase tracking-wide ${className}`}
    >
      {children}
    </span>
  );
}

export default function QuestionCard({
  question,
  index,
  total,
  state = NONE,
  onMark,
  open,
  onToggle,
  interview = false,
}) {
  /*
   * Open state is owned here unless a parent takes it.
   *
   * Revision mode and interview mode drive one card at a time and need to
   * force it shut when moving on; a topic page has many cards and lets each
   * keep its own. Both work because `open` is only honoured when a parent
   * actually passes it.
   */
  const [localOpen, setLocalOpen] = useState(false);
  const controlled = typeof open === "boolean";
  const isOpen = controlled ? open : localOpen;

  const [seen, setSeen] = useState(new Set());

  // A question changing under the same card — which is what happens in
  // revision mode — must not inherit the previous one's revealed follow-ups.
  useEffect(() => {
    setSeen(new Set());
  }, [question.id]);

  function toggle() {
    if (controlled) onToggle?.(!isOpen);
    else setLocalOpen((value) => !value);
  }

  const importance = IMPORTANCE[question.importance] || IMPORTANCE.low;
  const type = TYPES[question.type] || TYPES.conceptual;
  const unanswered = question.answer === UNANSWERED;
  /*
   * A question's body is its `solution` when it has one, otherwise its
   * `answer`.
   *
   * This used to key off `type === "numerical"`, which tied the worked-problem
   * shape to arithmetic. It is not about arithmetic: a traced concurrency
   * schedule has given data, a question, and a step-by-step working, and is a
   * scenario. The presence of `solution` is the signal, not the type.
   */
  const body = question.solution || question.answer;

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-surface/90 shadow-sm backdrop-blur-sm transition
                  ${state === NONE ? "border-brand-200/80" : MARK_STYLE[state].split(" ")[0]}`}
    >
      {/* ------------------------------------------------------- header -- */}
      <header className="flex flex-wrap items-start gap-2 px-4 pt-3.5">
        <Badge className="bg-brand-100 text-brand-800">
          <Icon name={type.icon} className="h-3 w-3" />
          {type.label}
        </Badge>

        <Badge
          className={
            question.importance === "high"
              ? "bg-rose-100 text-rose-800"
              : question.importance === "med"
                ? "bg-sky-100 text-sky-800"
                : "bg-brand-100 text-brand-800"
          }
        >
          <Icon name={importance.icon} className="h-3 w-3" />
          {importance.short}
        </Badge>

        {question.subtopic && (
          <Badge className="bg-brand-50 text-ink-500">{question.subtopic}</Badge>
        )}

        {state === DONE && (
          <Badge className="ml-auto bg-emerald-100 text-emerald-800">
            <Icon name="check" className="h-3 w-3" />
            Done
          </Badge>
        )}
        {state === REVISE && (
          <Badge className="ml-auto bg-amber-100 text-amber-800">
            <Icon name="repeat" className="h-3 w-3" />
            Revise
          </Badge>
        )}

        {typeof index === "number" && (
          <span className="ml-auto text-[11px] font-bold tabular-nums text-ink-500">
            {index + 1}
            {total ? ` / ${total}` : ""}
          </span>
        )}
      </header>

      {/* ----------------------------------------------------- question -- */}
      <div className="px-4 pb-3 pt-2.5">
        <h3 className="font-display text-base font-extrabold leading-snug text-ink-900">
          <Text>{question.question}</Text>
        </h3>

        {/* A numerical shows its data before the reveal — you cannot attempt
            the question without it, and hiding it would make the card a
            memory test rather than a working one. */}
        {question.given && (
          <div className="mt-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-ink-500">Given</p>
            <Blocks blocks={[{ table: question.given }]} />
            {question.find && (
              <>
                <p className="text-[10px] font-bold uppercase tracking-wide text-ink-500">Find</p>
                <p className="mt-1 text-sm text-ink-700">{question.find.join(" · ")}</p>
              </>
            )}
          </div>
        )}

        {/* MCQ options are part of the question, not the answer. */}
        {question.options && (
          <ol className="mt-3 space-y-1.5">
            {question.options.map((option, i) => (
              <li
                key={i}
                className={`flex gap-2.5 rounded-lg border px-2.5 py-1.5 text-sm transition
                            ${
                              isOpen && i === question.correct
                                ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                                : "border-brand-200 text-ink-700"
                            }`}
              >
                {/*
                  Inherits the row's colour, and is not dimmed.

                  It used to be `text-ink-500`, which is light in dark mode
                  while the correct option's row sits on a FIXED light
                  `bg-emerald-50` — so the letter on the one row that matters
                  was light grey on pale green, at 3.0 contrast.

                  Dimming it with opacity instead measured worse still: any
                  opacity blends the text toward its background, and 60% put
                  every letter under AA. A, B, C and D are how somebody refers
                  to an option out loud, so they are content, not decoration.
                  The row already knows what colour is readable on it.
                */}
                <span className="font-bold">{"ABCD"[i]}</span>
                <span>
                  <Text>{option}</Text>
                </span>
                {isOpen && i === question.correct && (
                  <Icon name="check" className="ml-auto h-4 w-4 shrink-0 text-emerald-700" />
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* ------------------------------------------------------- answer -- */}
      {!isOpen ? (
        <div className="border-t border-brand-100 px-4 py-3">
          <button onClick={toggle} className="btn-primary w-full sm:w-auto">
            Reveal answer
          </button>
          {interview && (
            <p className="mt-2 text-xs text-ink-500">
              Answer it out loud first. Recognising an answer is not the same as recalling one.
            </p>
          )}
        </div>
      ) : (
        <div className="border-t border-brand-100 bg-brand-50/40 px-4 py-3.5">
          {unanswered ? (
            <div className="rounded-xl border border-amber-400 bg-amber-50 px-3 py-3">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-800">
                <Icon name="warning" className="h-4 w-4" />
                Not answered in your notes
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-amber-900">
                This question is listed in your source material but no answer is given anywhere in
                it. It is kept because it is a real interview question — worth attempting, and worth
                looking up properly rather than reading a guess here.
              </p>
            </div>
          ) : (
            <>
              {question.short && (
                <p className="mb-2 rounded-xl border border-brand-300 bg-brand-100 px-3 py-2 text-sm font-bold leading-relaxed text-ink-900">
                  <Text>{question.short}</Text>
                </p>
              )}
              <Blocks blocks={body} />
            </>
          )}

          {question.tip && (
            <div className="mt-3 flex gap-2.5 rounded-xl border border-sky-300 bg-sky-50 px-3 py-2.5">
              <span className="mt-0.5 shrink-0 text-sky-700">
                <Icon name="bulb" className="h-4 w-4" />
              </span>
              <p className="text-xs leading-relaxed text-sky-900">
                <span className="font-bold">Interview tip. </span>
                <Text>{question.tip}</Text>
              </p>
            </div>
          )}

          {/*
            Follow-ups stay shut until asked for, one at a time.

            This is the whole reason they exist: an interviewer does not hand
            you the follow-up with the question, they ask it after you answer.
            Revealing them all at once would turn cross-questioning practice
            back into reading.
          */}
          {question.followUps?.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-ink-500">
                Likely follow-up{question.followUps.length > 1 ? "s" : ""}
              </p>
              <div className="mt-1.5 space-y-2">
                {question.followUps.map((followUp, i) => (
                  <div key={i} className="rounded-xl border border-brand-200 bg-surface px-3 py-2">
                    <p className="text-sm font-bold text-ink-900">
                      <Text>{followUp.q}</Text>
                    </p>
                    {seen.has(i) ? (
                      <p className="mt-1.5 text-sm leading-relaxed text-ink-700">
                        <Text>{followUp.a}</Text>
                      </p>
                    ) : (
                      <button
                        onClick={() => setSeen((prev) => new Set(prev).add(i))}
                        className="mt-1 text-xs font-bold text-brand-800 underline underline-offset-2 hover:text-brand-900"
                      >
                        Show answer
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ------------------------------------------------ the marks -- */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={() => onMark?.(question.id, state === DONE ? NONE : DONE)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-bold transition
                          ${
                            state === DONE
                              ? "border-emerald-500 bg-emerald-100 text-emerald-900"
                              : "border-brand-300 bg-surface text-ink-800 hover:border-emerald-400 hover:bg-emerald-50"
                          }`}
            >
              <Icon name="check" className="h-4 w-4" />
              {state === DONE ? "Done" : "Mark done"}
            </button>

            <button
              onClick={() => onMark?.(question.id, state === REVISE ? NONE : REVISE)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-bold transition
                          ${
                            state === REVISE
                              ? "border-amber-500 bg-amber-100 text-amber-900"
                              : "border-brand-300 bg-surface text-ink-800 hover:border-amber-400 hover:bg-amber-50"
                          }`}
            >
              <Icon name="repeat" className="h-4 w-4" />
              {state === REVISE ? "Queued" : "Revise later"}
            </button>

            <button onClick={toggle} className="btn-ghost ml-auto">
              Hide answer
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
