/*
 * The tick, the half-circle or the dash beside a problem.
 *
 * Three states, and the difference between the last two matters: "attempted"
 * means a submission was judged and did not pass, which is a different thing
 * from never having tried. Colour alone would not say that to someone who
 * cannot distinguish green from amber, so each state has its own shape and its
 * own title text.
 */
export default function StatusMark({ status }) {
  if (status === "solved") {
    return (
      <span title="Solved" aria-label="Solved" className="text-emerald-600">
        <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    );
  }

  if (status === "attempted") {
    return (
      <span title="Attempted, not yet solved" aria-label="Attempted" className="text-amber-500">
        <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
          <circle cx="10" cy="10" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 2.75a7.25 7.25 0 010 14.5z" fill="currentColor" />
        </svg>
      </span>
    );
  }

  return (
    <span title="Not attempted" aria-label="Not attempted" className="text-brand-300">
      <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
        <path d="M5 10h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    </span>
  );
}
