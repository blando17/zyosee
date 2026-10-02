import { useCallback, useEffect, useRef, useState } from "react";
import { BOARD_HEIGHT, BOARD_WIDTH } from "../thinkStore";

/*
 * A drawing board for working a problem out by hand.
 *
 * Everything is kept as points in a fixed 1600x1000 coordinate space rather
 * than as pixels on a canvas, which is what makes undo, resizing and saving
 * all straightforward. The canvas is redrawn from those points whenever
 * anything changes; at a few hundred strokes that is far too fast to notice.
 *
 * The parent owns the items, because it is the thing that saves them. Only the
 * redo stack lives here: it is a property of this editing session, and it would
 * be strange for a redo to survive a page reload.
 */

const COLOURS = [
  { name: "Ink", value: "#1a130d" },
  { name: "Red", value: "#dc2626" },
  { name: "Blue", value: "#2563eb" },
  { name: "Green", value: "#059669" },
];

// Board units. The canvas is usually drawn at a bit under half this scale, so
// these land at roughly 2, 4 and 8 pixels.
const WIDTHS = [
  { name: "Thin", stroke: 4, text: 28 },
  { name: "Medium", stroke: 9, text: 40 },
  { name: "Thick", stroke: 18, text: 58 },
];

const ERASER_REACH = 14;
const HISTORY_LIMIT = 50;

/*
 * The shapes an algorithm diagram is actually made of.
 *
 * Each is drawn by dragging from one corner to the other, and holding Shift
 * constrains it — a square rather than a rectangle, a circle rather than an
 * ellipse, an angle snapped to a multiple of 45 degrees. That is where the
 * neatness comes from: a hand-drawn box is fine for thinking, but a diagram
 * you are going to look at while writing code is easier to read square.
 */
const SHAPES = [
  { id: "line", label: "Line", hint: "Line — hold Shift to snap the angle", icon: "M4 16L16 4" },
  { id: "arrow", label: "Arrow", hint: "Arrow — hold Shift to snap the angle", icon: "M4 16L16 4M16 4h-5M16 4v5" },
  { id: "rect", label: "Rectangle", hint: "Rectangle — hold Shift for a square", icon: "M4 5h12v10H4z" },
  { id: "ellipse", label: "Ellipse", hint: "Ellipse — hold Shift for a circle", icon: "M10 4c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6 2.7-6 6-6z" },
  { id: "diamond", label: "Diamond", hint: "Diamond, for a decision — hold Shift to keep it even", icon: "M10 3l7 7-7 7-7-7z" },
];

const SHAPE_IDS = new Set(SHAPES.map((shape) => shape.id));

/*
 * The outline of any shape, as a flat list of points.
 *
 * One function, used for two jobs that must never disagree: drawing the shape,
 * and working out whether the eraser is touching it. Deriving the hit test
 * from the same points that get drawn means a shape can always be erased
 * exactly where it appears.
 */
function outline({ kind, x1, y1, x2, y2 }) {
  if (kind === "line" || kind === "arrow") return [x1, y1, x2, y2];

  const left = Math.min(x1, x2);
  const right = Math.max(x1, x2);
  const top = Math.min(y1, y2);
  const bottom = Math.max(y1, y2);
  const midX = (left + right) / 2;
  const midY = (top + bottom) / 2;

  if (kind === "rect") return [left, top, right, top, right, bottom, left, bottom, left, top];
  if (kind === "diamond") return [midX, top, right, midY, midX, bottom, left, midY, midX, top];

  // An ellipse, sampled. Thirty-two points is indistinguishable from a curve
  // at this size and makes it the same kind of object as every other shape.
  const rx = (right - left) / 2;
  const ry = (bottom - top) / 2;
  const points = [];
  for (let i = 0; i <= 32; i += 1) {
    const angle = (i / 32) * Math.PI * 2;
    points.push(midX + rx * Math.cos(angle), midY + ry * Math.sin(angle));
  }
  return points;
}

/* Shift held: square off a box, or snap a line to the nearest 45 degrees. */
function constrain(x1, y1, x2, y2, kind) {
  if (kind === "line" || kind === "arrow") {
    const length = Math.hypot(x2 - x1, y2 - y1);
    const step = Math.PI / 4;
    const angle = Math.round(Math.atan2(y2 - y1, x2 - x1) / step) * step;
    return [Math.round(x1 + length * Math.cos(angle)), Math.round(y1 + length * Math.sin(angle))];
  }
  const side = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  return [x1 + Math.sign(x2 - x1 || 1) * side, y1 + Math.sign(y2 - y1 || 1) * side];
}

/* Distance from a point to a line segment: the eraser's whole hit test. */
function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  // A segment of zero length is a point, and the projection below would divide
  // by zero.
  const t = lengthSquared ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared)) : 0;
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function touches(item, x, y, reach) {
  if (item.type === "shape") {
    const points = outline(item);
    for (let i = 0; i + 3 < points.length; i += 2) {
      if (distanceToSegment(x, y, points[i], points[i + 1], points[i + 2], points[i + 3]) <= reach + item.width) {
        return true;
      }
    }
    return false;
  }
  if (item.type === "text") {
    // Text has no path, so its rough box stands in for one.
    const width = (item.text.length * item.size) / 1.9;
    return x >= item.x - reach && x <= item.x + width + reach &&
           y >= item.y - item.size - reach && y <= item.y + reach;
  }
  const points = item.points;
  if (points.length === 2) return Math.hypot(x - points[0], y - points[1]) <= reach + item.width;
  for (let i = 0; i + 3 < points.length; i += 2) {
    if (distanceToSegment(x, y, points[i], points[i + 1], points[i + 2], points[i + 3]) <= reach + item.width) {
      return true;
    }
  }
  return false;
}

export function paintItem(ctx, item) {
  if (item.type === "shape") {
    const points = outline(item);
    ctx.strokeStyle = item.colour;
    ctx.lineWidth = item.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
    ctx.stroke();

    if (item.kind === "arrow") {
      // A head proportional to the line, so a thick arrow does not end in a
      // pinprick and a thin one is not swamped.
      const angle = Math.atan2(item.y2 - item.y1, item.x2 - item.x1);
      const head = Math.max(26, item.width * 4);
      const spread = 0.42;
      ctx.beginPath();
      for (const side of [-spread, spread]) {
        ctx.moveTo(item.x2, item.y2);
        ctx.lineTo(item.x2 - head * Math.cos(angle + side), item.y2 - head * Math.sin(angle + side));
      }
      ctx.stroke();
    }
    return;
  }

  if (item.type === "text") {
    ctx.fillStyle = item.colour;
    ctx.font = `600 ${item.size}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textBaseline = "alphabetic";
    ctx.fillText(item.text, item.x, item.y);
    return;
  }

  const points = item.points;
  ctx.strokeStyle = item.colour;
  ctx.lineWidth = item.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  if (points.length === 2) {
    // A tap with no movement: draw a dot, or it would leave nothing behind.
    ctx.arc(points[0], points[1], item.width / 2, 0, Math.PI * 2);
    ctx.fillStyle = item.colour;
    ctx.fill();
    return;
  }
  ctx.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
  ctx.stroke();
}

export default function ThinkingBoard({ items, onChange, boardId }) {
  const canvasRef = useRef(null);
  const liveRef = useRef(null);          // the stroke being drawn right now
  const frameRef = useRef(0);

  /*
   * Undo history, as whole snapshots of the board.
   *
   * The first version of this treated undo as "drop the last item", which
   * looks identical while you are only adding things and is wrong the moment
   * you erase: erasing replaces the list, so the next undo threw away a
   * different, innocent item and the erased one never came back.
   *
   * Snapshots are cheap here because a committed item is never mutated again,
   * so each one is an array of references rather than a copy of the drawing.
   */
  const pastRef = useRef([]);
  const futureRef = useRef([]);

  const [tool, setTool] = useState("pen");
  const [colour, setColour] = useState(COLOURS[0].value);
  const [size, setSize] = useState(1);
  const [typing, setTyping] = useState(null);   // { x, y } in board units
  const [draft, setDraft] = useState("");
  const [, forceRedraw] = useState(0);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;

    /*
     * Sized for the screen's pixel density and scaled into board units.
     * Assigning width or height resets the context, so both the transform and
     * the drawing have to happen after it every time.
     */
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    const ctx = canvas.getContext("2d");
    ctx.setTransform((rect.width * ratio) / BOARD_WIDTH, 0, 0, (rect.height * ratio) / BOARD_HEIGHT, 0, 0);
    ctx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

    // The dotted paper, which gives a sense of scale while drawing.
    ctx.fillStyle = "#e7d9b8";
    for (let x = 40; x < BOARD_WIDTH; x += 40) {
      for (let y = 40; y < BOARD_HEIGHT; y += 40) {
        ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
      }
    }

    for (const item of items) paintItem(ctx, item);
    if (liveRef.current) paintItem(ctx, liveRef.current);
  }, [items]);

  useEffect(() => {
    paint();
  }, [paint]);

  // Redraw at the new size rather than letting the browser stretch the bitmap,
  // which is the advantage of keeping points instead of pixels.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => paint());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [paint]);

  const commit = useCallback(
    (next) => {
      // Bounded: fifty steps back is far more than anyone reaches for, and it
      // stops a long session growing a history without end.
      pastRef.current = [...pastRef.current, items].slice(-HISTORY_LIMIT);
      futureRef.current = [];
      onChange(next);
    },
    [items, onChange]
  );

  function undo() {
    const past = pastRef.current;
    if (!past.length) return;
    futureRef.current = [...futureRef.current, items];
    pastRef.current = past.slice(0, -1);
    onChange(past[past.length - 1]);
  }

  function redo() {
    const future = futureRef.current;
    if (!future.length) return;
    pastRef.current = [...pastRef.current, items];
    futureRef.current = future.slice(0, -1);
    onChange(future[future.length - 1]);
  }

  // A board loaded for a different problem starts with a clean history: undoing
  // into the previous problem's drawing would be baffling.
  useEffect(() => {
    pastRef.current = [];
    futureRef.current = [];
  }, [boardId]);

  useEffect(() => {
    function onKeyDown(event) {
      // Ctrl+Z belongs to whatever field has focus when one does.
      const inField = /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName || "");
      if (inField || !(event.metaKey || event.ctrlKey)) return;
      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) { event.preventDefault(); undo(); }
      else if ((key === "z" && event.shiftKey) || key === "y") { event.preventDefault(); redo(); }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function toBoard(event) {
    const rect = canvasRef.current.getBoundingClientRect();
    return [
      Math.round(((event.clientX - rect.left) / rect.width) * BOARD_WIDTH),
      Math.round(((event.clientY - rect.top) / rect.height) * BOARD_HEIGHT),
    ];
  }

  function erase(x, y) {
    const kept = items.filter((item) => !touches(item, x, y, ERASER_REACH));
    if (kept.length !== items.length) commit(kept);
  }

  /*
   * Placing text happens on click, not on pointer down, and that is a fix
   * rather than a preference.
   *
   * Mounting the input during pointerdown put it on screen and focused it
   * BEFORE the browser had finished with the press. The mousedown that follows
   * a pointerdown moves focus to whatever was clicked — here a canvas, which
   * cannot hold focus — so the freshly focused input was blurred a moment
   * after appearing, and the blur handler below closed it. The tool looked
   * completely dead: one click, nothing there.
   *
   * By the time click fires, that focus change has already happened, so the
   * input mounts afterwards and keeps focus.
   */
  function handleClick(event) {
    if (tool !== "text") return;
    const [x, y] = toBoard(event);
    setTyping({ x, y });
    setDraft("");
  }

  // One repaint per animation frame, however fast the pointer reports.
  function schedulePaint() {
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      paint();
    });
  }

  function handlePointerDown(event) {
    if (event.button !== undefined && event.button !== 0) return;
    if (tool === "text") return;      // handled on click, see above
    const [x, y] = toBoard(event);

    if (tool === "eraser") {
      event.currentTarget.setPointerCapture(event.pointerId);
      erase(x, y);
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    liveRef.current = SHAPE_IDS.has(tool)
      ? { type: "shape", kind: tool, colour, width: WIDTHS[size].stroke, x1: x, y1: y, x2: x, y2: y }
      : { type: "stroke", colour, width: WIDTHS[size].stroke, points: [x, y] };
    paint();
  }

  function handlePointerMove(event) {
    const [x, y] = toBoard(event);

    if (tool === "eraser" && event.buttons) { erase(x, y); return; }
    const live = liveRef.current;
    if (!live) return;

    if (live.type === "shape") {
      // Read Shift on every move, not on the press, so it can be held or let
      // go part way through and the shape follows.
      const [endX, endY] = event.shiftKey
        ? constrain(live.x1, live.y1, x, y, live.kind)
        : [x, y];
      live.x2 = endX;
      live.y2 = endY;
      schedulePaint();
      return;
    }

    const points = live.points;
    // Points closer together than this add nothing but storage.
    if (Math.hypot(x - points[points.length - 2], y - points[points.length - 1]) < 4) return;
    points.push(x, y);
    schedulePaint();
  }

  function handlePointerUp() {
    const live = liveRef.current;
    if (!live) return;
    liveRef.current = null;

    /*
     * A shape needs a drag. Clicking once with the rectangle tool selected
     * would otherwise leave a zero-sized box on the board: invisible, still
     * there, and erasable only by hunting for it.
     */
    if (live.type === "shape" && Math.hypot(live.x2 - live.x1, live.y2 - live.y1) < 12) {
      paint();
      return;
    }

    commit([...items, live]);
  }

  function commitText() {
    const text = draft.trim();
    if (text && typing) {
      commit([...items, { type: "text", colour, size: WIDTHS[size].text, x: typing.x, y: typing.y, text }]);
    }
    setTyping(null);
    setDraft("");
  }

  const Tool = ({ id, label, children }) => (
    <button
      type="button"
      onClick={() => { setTool(id); setTyping(null); }}
      title={label}
      aria-label={label}
      aria-pressed={tool === id}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
        tool === id ? "bg-brand-300 text-ink-900" : "text-brand-800 hover:bg-brand-100"
      }`}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col">
      {/*
       * This box must hug the canvas exactly, which is why it does not stretch.
       *
       * It used to be flex-1 inside a full-height column, so when the plan
       * beside it was taller the box grew and the canvas — which keeps a fixed
       * 16:10 shape — did not. The leftover strip was inside the border, white,
       * and looked exactly like board. Clicking it did nothing, because there
       * was no canvas under it.
       *
       * The same mistake moved the text caret: the input is positioned as a
       * percentage of this box, so while the box was taller than the canvas,
       * text landed lower than where it was clicked.
       */}
      <div className="relative overflow-hidden rounded-xl border border-brand-200 bg-surface">
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ aspectRatio: `${BOARD_WIDTH} / ${BOARD_HEIGHT}`, touchAction: "none" }}
          className={`block w-full ${tool === "text" ? "cursor-text" : "cursor-crosshair"}`}
        />

        {typing && (
          <input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") commitText();
              if (event.key === "Escape") { setTyping(null); setDraft(""); }
            }}
            onBlur={commitText}
            placeholder="Type, then press Enter"
            style={{
              left: `${(typing.x / BOARD_WIDTH) * 100}%`,
              top: `${(typing.y / BOARD_HEIGHT) * 100}%`,
              color: colour,
              // The caret sits on the text's baseline, so the box belongs above
              // it — except near the top edge, where the frame would clip it.
              transform: typing.y < BOARD_HEIGHT * 0.12 ? "none" : "translateY(-100%)",
              maxWidth: "60%",
            }}
            className="absolute rounded-md border border-brand-300 bg-surface/95 px-2 py-1
                       text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1 rounded-xl border border-brand-200 bg-surface px-2 py-1.5">
        <Tool id="pen" label="Pen">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M13.6 2.9a1.6 1.6 0 012.3 0l1.2 1.2a1.6 1.6 0 010 2.3l-8.7 8.7-3.9.9.9-3.9 8.2-9.2z" /></svg>
        </Tool>
        <Tool id="text" label="Text">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M4 4h12v2.5h-4.6V16H8.6V6.5H4z" /></svg>
        </Tool>
        <Tool id="eraser" label="Eraser">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M7 16l-3-3 7-7 5 5-5 5zM8 17h8" strokeLinejoin="round" /></svg>
        </Tool>

        <span className="mx-1 h-5 w-px bg-brand-200" />

        {/* Icon only. The shapes are recognisable without a word beside them,
            and five more labels would push everything else onto a third row. */}
        {SHAPES.map((shape) => (
          <button
            key={shape.id}
            type="button"
            onClick={() => { setTool(shape.id); setTyping(null); }}
            title={shape.hint}
            aria-label={shape.label}
            aria-pressed={tool === shape.id}
            className={`rounded-lg p-1.5 transition ${
              tool === shape.id ? "bg-brand-300 text-ink-900" : "text-brand-800 hover:bg-brand-100"
            }`}
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6"
                 strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={shape.icon} />
            </svg>
          </button>
        ))}

        <span className="mx-1 h-5 w-px bg-brand-200" />

        <button type="button" onClick={undo} disabled={!pastRef.current.length} title="Undo (Ctrl+Z)"
          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-800 transition hover:bg-brand-100 disabled:opacity-40">
          Undo
        </button>
        <button type="button" onClick={redo} disabled={!futureRef.current.length} title="Redo (Ctrl+Shift+Z)"
          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-800 transition hover:bg-brand-100 disabled:opacity-40">
          Redo
        </button>

        <span className="mx-1 h-5 w-px bg-brand-200" />

        {COLOURS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setColour(option.value)}
            title={option.name}
            aria-label={option.name}
            aria-pressed={colour === option.value}
            className={`h-5 w-5 rounded-full ring-offset-1 transition ${colour === option.value ? "ring-2 ring-brand-500" : "hover:scale-110"}`}
            style={{ backgroundColor: option.value }}
          />
        ))}

        <span className="mx-1 h-5 w-px bg-brand-200" />

        {WIDTHS.map((option, index) => (
          <button
            key={option.name}
            type="button"
            onClick={() => setSize(index)}
            title={option.name}
            aria-label={option.name}
            aria-pressed={size === index}
            className={`flex h-6 w-6 items-center justify-center rounded-lg transition ${size === index ? "bg-brand-200" : "hover:bg-brand-100"}`}
          >
            <span className="rounded-full bg-code" style={{ width: 3 + index * 3, height: 3 + index * 3 }} />
          </button>
        ))}

        <button
          type="button"
          onClick={() => { if (items.length && window.confirm("Clear the whole board?")) commit([]); }}
          disabled={!items.length}
          className="ml-auto rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-40"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

/*
 * A small, non-interactive picture of a board.
 *
 * Used on the problem page so a sketch made earlier is recognisable at a
 * glance. It draws the same items through the same function, so the thumbnail
 * can never drift from the board it stands for.
 */
export function BoardPreview({ items, className = "" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    const ctx = canvas.getContext("2d");
    ctx.setTransform((rect.width * ratio) / BOARD_WIDTH, 0, 0, (rect.height * ratio) / BOARD_HEIGHT, 0, 0);
    ctx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
    // No dotted paper here: at this size it would read as noise.
    for (const item of items) paintItem(ctx, item);
  }, [items]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Your sketch"
      style={{ aspectRatio: `${BOARD_WIDTH} / ${BOARD_HEIGHT}` }}
      className={`block w-full rounded-lg border border-brand-200 bg-surface ${className}`}
    />
  );
}
