/*
 * Boilerplate for an empty editor.
 *
 * Two reasons this exists in one file rather than two.
 *
 * A problem may carry its own starter code, written by whoever authored it, and
 * the two migrated problems do: theirs parses that problem's exact input format
 * and leaves a comment where the answer goes. Problems written through the Add
 * Problem page carry none, and before this an editor for one of those opened
 * completely empty in every language, which is a worse place to start than a
 * skeleton that at least compiles.
 *
 * So: the problem's own starter wins, and these fill in for every language it
 * does not cover.
 *
 * The Java class must be called Main. languages.js writes the submitted source
 * to a file literally named Main.java and runs `java -cp <dir> Main`, because
 * javac insists a public class live in a file of the same name. A skeleton
 * calling it Solution would fail to compile before the solver had typed
 * anything, and the error would point at the boilerplate rather than at them.
 *
 * Each of these compiles and runs as it stands, reading nothing and printing
 * nothing, so pressing Run on an untouched editor gives an empty result rather
 * than an error.
 */

export const DEFAULT_STARTERS = {
  cpp: `#include <iostream>
using namespace std;

int main() {

    return 0;
}`,

  c: `#include <stdio.h>

int main(void) {

    return 0;
}`,

  // Reading everything at once and splitting is the usual shape for a judge:
  // input() per line is slow once there are a hundred thousand of them.
  py: `import sys

data = sys.stdin.read().split()

# Your code here
`,

  java: `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));

        // Your code here
    }
}`,
};

/*
 * The starters for the standalone compiler page.
 *
 * Deliberately not the skeletons above. That page has no problem attached, so
 * a solver arriving at it has nothing telling them the editor is wired to the
 * input box below. Adding two numbers is the smallest program that shows it.
 */
export const COMPILER_STARTERS = {
  cpp: `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}`,

  c: `#include <stdio.h>

int main(void) {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("%d\\n", a + b);
    return 0;
}`,

  py: `a, b = map(int, input().split())
print(a + b)`,

  java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println(a + b);
    }
}`,
};

// What an editor should hold for this problem in this language.
export function starterFor(problem, language) {
  return problem?.starter?.[language] ?? DEFAULT_STARTERS[language] ?? "";
}

/*
 * Whether the editor still holds boilerplate nobody has edited.
 *
 * Switching language swaps the skeleton, but only when there is no work to
 * lose. It has to consider the problem's own starters and the defaults
 * together, because a problem may supply three languages and fall back to the
 * default for the fourth.
 */
export function isUntouchedStarter(code, problem) {
  const candidates = [
    ...Object.values(problem?.starter || {}),
    ...Object.values(DEFAULT_STARTERS),
  ];
  const trimmed = String(code).trim();
  return trimmed === "" || candidates.some((starter) => String(starter).trim() === trimmed);
}
