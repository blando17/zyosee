# Importing the CSES problem set

Four hundred problems from `cses_problems/` become problems **501–900** in the
`problems` collection, with their test data under `compiler/testdata/`.

```bash
node scripts/cses/scan.cjs                 # what is in the source tree
node scripts/cses/import.cjs --dry-run     # what would be written
node scripts/cses/import.cjs               # write it
node scripts/cses/validate.cjs             # check it
node scripts/cses/validate.cjs --deep      # also check every test file's bytes
```

The import is **idempotent**. Running it twice updates the same 400 documents,
places no files, and changes nothing else; it is keyed on `problemId`, which is
`cses-<the task's id on the official problem set>`.

## What it writes

| field | value |
|---|---|
| `slug` | `cses-` + the title, e.g. `cses-weird-algorithm` |
| `problemId` | `cses-1068` — the official task id, so re-runs update rather than duplicate |
| `number` | 500 + the folder's number, so 501–900 |
| `tags` | `["cses", "<official category>"]` |
| `difficulty` | derived from the category — see below |
| `statement`, `inputFormat`, `outputFormat`, `constraints` | parsed from the folder's `.txt` |
| `tests` | the statement's examples as samples, then the provided files as hidden tests |
| `source` | `"cses-import"`, which is how everything here finds its own documents |
| `metadata` | where it came from and every caveat. Internal: `publicView` never returns it |

Nothing else in the schema changes. The document is the same shape the Add
Problem page produces, the manifest is the same shape `writeCases` returns, and
the files sit in the same `testdata/<slug>/N.in` layout, so the compiler cannot
tell an imported problem from an authored one.

## Two decisions worth knowing about

**Test files are hard-linked, not copied.** The set is 4.6 GB and the machine it
was imported on had 8.7 GB free. A link costs a directory entry and no data.
The files are immutable inputs and the compiler mounts `testdata/` read-only, so
nothing writes through the link; deleting `cses_problems/` later leaves the
judge's copy working, because the data outlives the last link to it. Where links
are not available the importer falls back to copying.

**Difficulty is derived, not imported.** CSES publishes no difficulty and the
schema requires one. Rather than guess four hundred times, `DIFFICULTY_BY_CATEGORY`
in `import.cjs` maps each official category to a level; change a line there and
re-run to reclassify a whole category. Every document records
`metadata.difficultySource` so the value is never mistaken for something the
source said.

## What the source could not supply

Eight problems have no usable test data, and none was invented for them.

- **Six interactive problems** (770–775). The solver talks to a grader instead
  of reading a fixed input, so there is no static input and output to store. The
  folders do contain `.in` files and zero-byte `.out` files; importing those
  would mean judging against an empty expected output, so any program printing
  nothing would be marked correct. They are imported with their statements and
  no tests, and `judge.js` now refuses to return a verdict for a problem with no
  tests rather than accepting everything.
- **702 Longest Palindrome.** The provided folder holds a byte-for-byte copy of
  problem 142, Range Queries and Copies — the wrong statement *and* the wrong
  tests.
- **860 Subsets with Fixed Average.** The provided folder is empty.

Those last two have their statements in `recovered/`, taken from the official
problem set; see the README there. Both are imported with the example from their
statement as their only test.

Separately, **66 problems accept any valid answer** ("if there are several
solutions, you may print any of them"). This judge compares output to expected
output, so a correct but differently-ordered answer is marked wrong. Each of
those carries `metadata.multipleAnswers: true`, so a special judge added later
can find them with one query:

```js
db.problems.find({ "metadata.multipleAnswers": true })
```

## Files

| file | what it does |
|---|---|
| `scan.cjs` | walks `cses_problems/`, pairs `.in` with `.out`, reports the shapes it found |
| `parse.cjs` | one statement `.txt` → title, limits, statement, formats, constraints, examples |
| `import.cjs` | builds the documents, places the test files, upserts |
| `validate.cjs` | checks the collection, the disk and the source tree against each other |
| `lib.cjs` | database connection and the slug rule, shared |
| `official.json` | the official problem set: 400 titles, ids and categories, in order |
| `recovered/` | the two statements the provided folders could not supply |

`official.json` is what the folders are checked against — all 400 folder names
match their official title in the official order, which is what makes
"folder N is official problem N" a fact rather than an assumption.

`scripts/assign-numbers.js` is unaffected: it only numbers problems that have no
number, and all 400 of these do.
