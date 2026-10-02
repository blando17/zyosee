import { useMemo, useState } from "react";

/*
 * The filter column.
 *
 * Every count shown here is the number of problems that WOULD remain if that
 * box were ticked, given whatever else is already ticked. That is more work
 * than counting the whole set once, and it is the difference between a filter
 * list you can trust and one that offers you a topic leading to an empty page.
 *
 * The counts are computed by the page, which owns the problems; this component
 * only draws them.
 */

const STATUSES = [
  { id: "all", label: "All" },
  { id: "solved", label: "Solved" },
  { id: "attempted", label: "Attempted" },
  { id: "unsolved", label: "Unsolved" },
];

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

function Section({ title, children }) {
  return (
    <div className="border-t border-brand-100 px-4 py-4 first:border-t-0">
      <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wide text-brand-800">{title}</h3>
      {children}
    </div>
  );
}

function Count({ value }) {
  return <span className="ml-auto pl-2 text-xs tabular-nums text-brand-700">{value}</span>;
}

/*
 * A long list of tick boxes with a search field and a "show more".
 *
 * Used for both topics and companies. There are eighty-one companies; drawing
 * them all would bury the rest of the page, and drawing only the top handful
 * with no way to search would hide most of them for good.
 */
function FacetList({ items, selected, onToggle, searchable, emptyText }) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const matching = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? items.filter((item) => item.name.toLowerCase().includes(needle)) : items;
  }, [items, query]);

  /*
   * A selected item stays visible even when it falls outside the first handful,
   * so a filter can always be switched off where it was switched on.
   */
  const visible = expanded || query
    ? matching
    : matching.filter((item, index) => index < 8 || selected.has(item.name));

  return (
    <div>
      {searchable && (
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search topics..."
          className="mb-2.5 w-full rounded-lg border border-brand-200 bg-surface px-3 py-1.5 text-sm
                     placeholder-brand-400/80 focus:border-brand-400 focus:outline-none
                     focus:ring-2 focus:ring-brand-200 [&::-webkit-search-cancel-button]:appearance-none"
        />
      )}

      <ul className="space-y-1">
        {visible.map((item) => (
          <li key={item.name}>
            <label className="flex cursor-pointer items-center rounded-md px-1 py-1 text-sm text-ink-800 hover:bg-brand-50">
              <input
                type="checkbox"
                checked={selected.has(item.name)}
                onChange={() => onToggle(item.name)}
                className="mr-2 h-3.5 w-3.5 shrink-0 rounded border-brand-300 text-brand-500
                           focus:ring-brand-400"
              />
              <span className="truncate capitalize">{item.name}</span>
              <Count value={item.count} />
            </label>
          </li>
        ))}
      </ul>

      {!visible.length && <p className="px-1 py-1 text-sm text-brand-700">{emptyText}</p>}

      {!query && matching.length > visible.length && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2 text-xs font-semibold text-brand-700 hover:text-brand-900"
        >
          Show more ({matching.length - visible.length})
        </button>
      )}
      {!query && expanded && matching.length > 8 && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="mt-2 text-xs font-semibold text-brand-700 hover:text-brand-900"
        >
          Show fewer
        </button>
      )}
    </div>
  );
}

export default function ProblemFilters({ facets, filters, onChange, onReset, showStatus, dirty }) {
  function toggleIn(key, value) {
    const next = new Set(filters[key]);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange({ [key]: next });
  }

  return (
    <aside className="rounded-2xl border border-brand-200 bg-surface shadow-sm">
      <div className="flex items-center justify-between px-4 pb-1 pt-4">
        <h2 className="text-base font-bold text-ink-900">Filters</h2>
        <button
          type="button"
          onClick={onReset}
          disabled={!dirty}
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700
                     transition hover:text-brand-900 disabled:cursor-default disabled:opacity-40"
        >
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.389zm-8.181-6.85a5.5 5.5 0 019.201 2.466l.312.311h-2.433a.75.75 0 000 1.5h4.243a.75.75 0 00.75-.75V3.859a.75.75 0 00-1.5 0v2.43l-.31-.31A7 7 0 005.681 9.117a.75.75 0 101.449.389z"
              clipRule="evenodd"
            />
          </svg>
          Reset
        </button>
      </div>

      {showStatus && (
        <Section title="Status">
          <ul className="space-y-1">
            {STATUSES.map((status) => (
              <li key={status.id}>
                <label className="flex cursor-pointer items-center rounded-md px-1 py-1 text-sm text-ink-800 hover:bg-brand-50">
                  <input
                    type="radio"
                    name="status"
                    checked={filters.status === status.id}
                    onChange={() => onChange({ status: status.id })}
                    className="mr-2 h-3.5 w-3.5 border-brand-300 text-brand-500 focus:ring-brand-400"
                  />
                  {status.label}
                  {status.id !== "all" && <Count value={facets.status[status.id]} />}
                </label>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Difficulty">
        <ul className="space-y-1">
          {DIFFICULTIES.map((level) => (
            <li key={level}>
              <label className="flex cursor-pointer items-center rounded-md px-1 py-1 text-sm text-ink-800 hover:bg-brand-50">
                <input
                  type="checkbox"
                  checked={filters.difficulties.has(level)}
                  onChange={() => toggleIn("difficulties", level)}
                  className="mr-2 h-3.5 w-3.5 rounded border-brand-300 text-brand-500 focus:ring-brand-400"
                />
                {level}
                <Count value={facets.difficulty[level] || 0} />
              </label>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Topics">
        <FacetList
          items={facets.topics}
          selected={filters.topics}
          onToggle={(name) => toggleIn("topics", name)}
          searchable
          emptyText="No topic matches that."
        />
      </Section>

      <Section title="Companies">
        <FacetList
          items={facets.companies}
          selected={filters.companies}
          onToggle={(name) => toggleIn("companies", name)}
          emptyText="No company matches that."
        />
      </Section>
    </aside>
  );
}
