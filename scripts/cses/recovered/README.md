# Statements recovered from the official problem set

Two of the 400 provided folders could not supply a statement:

- `202_Longest_Palindrome` holds a byte-for-byte copy of problem 142,
  "Range Queries and Copies" — the wrong statement *and* the wrong tests.
  Verified by hashing: the seven test inputs and all seven expected outputs are
  identical to 142's, and the statement text is identical too.
- `360_Subsets_with_Fixed_Average` is an empty directory. No statement, no
  tests, nothing.

Rather than import two problems with no description, the statements below were
taken from the official problem set, which the task names as the reference for
verifying a problem's metadata. They are stored in exactly the layout the
provided `.txt` files use, so the same parser reads them and nothing special
happens downstream.

Neither problem has test data, from the folders or from here — the official
site does not publish test files. Both are therefore imported with only the
example from their statement as a test, and `metadata.statementSource` records
that the statement did not come from the provided folder.
