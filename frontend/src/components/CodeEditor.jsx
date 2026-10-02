import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs/components/prism-core";
// Prism grammars build on each other, so the import order is not decorative:
// clike underpins c, c underpins cpp, and java needs clike too.
import "prismjs/components/prism-clike";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-java";
import "prismjs/components/prism-python";
import "prismjs/themes/prism.css";

/*
 * The editor, shared by the scratch compiler and the problem pages so both
 * behave identically and a change to highlighting or font size lands in one
 * place.
 */

export const LANGUAGE_OPTIONS = [
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "py", label: "Python 3" },
  { value: "java", label: "Java" },
];

// react-simple-code-editor needs the grammar object itself, not its name.
const GRAMMARS = {
  cpp: () => languages.cpp,
  c: () => languages.c,
  py: () => languages.python,
  java: () => languages.java,
};

/*
 * The line box, pinned rather than left to the browser.
 *
 * Anything drawn over the editor — a collaborator's cursor, say — has to know
 * exactly how tall a line is to land on the right one. A default line-height
 * of "normal" is font-dependent and differs between platforms, so it is set
 * here and exported, and the two can never drift apart.
 */
export const EDITOR_LINE_HEIGHT = 20;
export const EDITOR_PADDING = 16;

export default function CodeEditor({
  value,
  onChange,
  language,
  height = "420px",
  overlay = null,
  onCaretLine = null,
  textareaId = "code-editor",
  readOnly = false,
}) {
  /*
   * resize-y gives the native drag handle in the bottom right corner, so the
   * editor can be pulled taller for a long solution or shrunk out of the way.
   * `height` is only the starting size; once dragged, the browser remembers
   * what you chose for as long as the page is open.
   */
  /*
   * Which line the caret is on, 1-based.
   *
   * Counted from the text before the caret rather than read off the DOM, which
   * keeps it correct when a line wraps: a collaborator cares which line of the
   * file you are on, not which visual row.
   */
  function reportCaret(event) {
    if (!onCaretLine) return;
    const position = event.target.selectionStart ?? 0;
    onCaretLine(value.slice(0, position).split("\n").length);
  }

  const lineCount = value.split("\n").length;

  return (
    <div
      /* The replacement focus indicator: a quiet brand-coloured ring around
         the whole editor when anything inside it has focus. */
      className="relative min-h-[140px] resize-y overflow-auto bg-surface transition
                 focus-within:ring-2 focus-within:ring-inset focus-within:ring-brand-300"
      style={{ height }}
    >
      {/*
        As wide as the code, and never narrower than the box. That is what lets
        a long line scroll sideways instead of being cut off, while a short file
        still fills the width.
      */}
      <div className="flex w-max min-w-full">
        {/*
          The gutter is sticky to the LEFT, not fixed.
          Sticky keeps it against the left edge while the code scrolls
          sideways, and still lets it scroll away upwards with the code it
          belongs to — which is exactly the behaviour a gutter needs and
          neither `fixed` nor plain flow gives.
        */}
        <div
          aria-hidden="true"
          /* Opaque, not tinted-transparent: the code slides underneath it when a
             long line is scrolled, and anything less than solid lets that text
             show through behind the numbers. */
          className="sticky left-0 z-10 shrink-0 select-none border-r border-brand-100 bg-brand-50 text-right text-brand-400"
          style={{
            fontFamily: '"Fira Code", "Fira Mono", monospace',
            fontSize: 13,
            lineHeight: `${EDITOR_LINE_HEIGHT}px`,
            // Matching the editor's own padding is what keeps number 1 level
            // with the first line of code.
            paddingTop: EDITOR_PADDING,
            paddingBottom: EDITOR_PADDING,
            paddingLeft: 10,
            paddingRight: 8,
            // Grows with the file so four-digit files do not squash the code.
            minWidth: `${String(lineCount).length + 2}ch`,
          }}
        >
          {Array.from({ length: lineCount }, (_, index) => (
            <div key={index + 1}>{index + 1}</div>
          ))}
        </div>

        <div className="relative">
          {/* Drawn over the code, inside the scrolling box, so markers travel
              with the text instead of floating over a fixed frame. */}
          {overlay}
          <Editor
            className="oj-editor"
            value={value}
            onValueChange={onChange}
            highlight={(source) => highlight(source, GRAMMARS[language](), language)}
            padding={EDITOR_PADDING}
            textareaId={textareaId}
            readOnly={readOnly}
            onKeyUp={reportCaret}
            onClick={reportCaret}
            onFocus={reportCaret}
            style={{
              fontFamily: '"Fira Code", "Fira Mono", monospace',
              fontSize: 13,
              lineHeight: `${EDITOR_LINE_HEIGHT}px`,
              minHeight: "100%",
              outline: "none",
              position: "relative",
              zIndex: 1,
            }}
          />
        </div>
      </div>
    </div>
  );
}
