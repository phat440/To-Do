import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Check, Pencil, ListChecks } from "lucide-react";

const PRIORITIES = {
  low: {
    label: "ต่ำ",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    bar: "border-l-emerald-400",
    pick: "bg-emerald-50 text-emerald-700 ring-emerald-300",
    dot: "bg-emerald-500",
  },
  medium: {
    label: "ปานกลาง",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    bar: "border-l-amber-400",
    pick: "bg-amber-50 text-amber-700 ring-amber-300",
    dot: "bg-amber-500",
  },
  high: {
    label: "สูง",
    badge: "bg-rose-50 text-rose-700 ring-rose-200",
    bar: "border-l-rose-400",
    pick: "bg-rose-50 text-rose-700 ring-rose-300",
    dot: "bg-rose-500",
  },
};
const ORDER = ["low", "medium", "high"];

const FILTERS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "active", label: "ยังไม่เสร็จ" },
  { key: "completed", label: "เสร็จแล้ว" },
];

const EMPTY_TEXT = {
  all: "ยังไม่มีงาน เพิ่มงานแรกของคุณด้านบนได้เลย",
  active: "ไม่มีงานที่ค้างอยู่ เยี่ยมมาก!",
  completed: "ยังไม่มีงานที่เสร็จแล้ว",
};

const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1";

function PriorityBadge({ priority, onClick }) {
  const p = PRIORITIES[priority];
  return (
    <button
      type="button"
      onClick={onClick}
      title="คลิกเพื่อเปลี่ยนระดับความสำคัญ"
      className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors ${p.badge} ${focusRing}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} />
      {p.label}
    </button>
  );
}

function TodoItem({ todo, onToggle, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);
  const inputRef = useRef(null);
  const p = PRIORITIES[todo.priority];

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = () => {
    if (todo.removing) return;
    setDraft(todo.text);
    setEditing(true);
  };

  const commit = () => {
    const value = draft.trim();
    if (value && value !== todo.text) onUpdate(todo.id, { text: value });
    setEditing(false);
  };

  const cancel = () => {
    setDraft(todo.text);
    setEditing(false);
  };

  const cyclePriority = () => {
    const next = ORDER[(ORDER.indexOf(todo.priority) + 1) % ORDER.length];
    onUpdate(todo.id, { priority: next });
  };

  return (
    <li
      className={todo.fresh ? "todo-enter" : ""}
      style={{
        display: "grid",
        gridTemplateRows: todo.removing ? "0fr" : "1fr",
        opacity: todo.removing ? 0 : 1,
        transition: "grid-template-rows 280ms ease, opacity 220ms ease",
      }}
    >
      <div className="min-h-0 overflow-hidden px-1 pt-1 pb-1.5">
        <div
          className={`flex items-center gap-3 rounded-xl border border-l-4 border-slate-100 bg-white px-3 py-3 shadow-sm sm:px-4 ${p.bar}`}
        >
          {/* Checkbox */}
          <button
            type="button"
            role="checkbox"
            aria-checked={todo.done}
            aria-label={todo.done ? "ทำเครื่องหมายว่ายังไม่เสร็จ" : "ทำเครื่องหมายว่าเสร็จแล้ว"}
            onClick={() => onToggle(todo.id)}
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
              todo.done
                ? "border-slate-800 bg-slate-800 text-white"
                : "border-slate-300 bg-white text-transparent hover:border-slate-500"
            } ${focusRing}`}
          >
            <Check size={14} strokeWidth={3} />
          </button>

          {/* Text / edit field */}
          <div className="min-w-0 flex-1">
            {editing ? (
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit();
                  if (e.key === "Escape") cancel();
                }}
                aria-label="แก้ไขงาน"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-base text-slate-800 focus:border-slate-500 focus:outline-none"
              />
            ) : (
              <p
                onDoubleClick={startEdit}
                title="ดับเบิลคลิกเพื่อแก้ไข"
                className={`cursor-text select-none break-words text-base leading-relaxed transition-colors ${
                  todo.done ? "text-slate-400 line-through" : "text-slate-800"
                }`}
              >
                {todo.text}
              </p>
            )}
          </div>

          <PriorityBadge priority={todo.priority} onClick={cyclePriority} />

          {/* Actions */}
          <div className="flex shrink-0 items-center">
            <button
              type="button"
              onClick={startEdit}
              aria-label="แก้ไขงาน"
              className={`rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 ${focusRing}`}
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(todo.id)}
              aria-label="ลบงาน"
              className={`rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 ${focusRing}`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

export default function TodoApp() {
  const nextId = useRef(4);
  const [todos, setTodos] = useState([
    { id: 1, text: "ส่งรายงานประจำเดือนให้หัวหน้า", done: false, priority: "high" },
    { id: 2, text: "โทรนัดหมอฟัน", done: false, priority: "medium" },
    { id: 3, text: "ซื้อของเข้าบ้านที่ตลาด", done: true, priority: "low" },
  ]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [filter, setFilter] = useState("all");

  const addTodo = () => {
    const value = text.trim();
    if (!value) return;
    setTodos((prev) => [
      { id: nextId.current++, text: value, done: false, priority, fresh: true },
      ...prev,
    ]);
    setText("");
  };

  const toggleTodo = (id) =>
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done, fresh: false } : t))
    );

  const updateTodo = (id, patch) =>
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch, fresh: false } : t))
    );

  const removeWithAnimation = (ids) => {
    setTodos((prev) =>
      prev.map((t) => (ids.includes(t.id) ? { ...t, removing: true } : t))
    );
    setTimeout(() => {
      setTodos((prev) => prev.filter((t) => !ids.includes(t.id)));
    }, 300);
  };

  const deleteTodo = (id) => removeWithAnimation([id]);

  const clearCompleted = () =>
    removeWithAnimation(todos.filter((t) => t.done).map((t) => t.id));

  const visible = todos.filter((t) =>
    filter === "active" ? !t.done : filter === "completed" ? t.done : true
  );
  const remaining = todos.filter((t) => !t.done).length;
  const completedCount = todos.filter((t) => t.done).length;
  const counts = { all: todos.length, active: remaining, completed: completedCount };

  return (
    <div
      className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:py-14"
      style={{
        fontFamily:
          "'Noto Sans Thai', 'Sarabun', 'Leelawadee UI', Tahoma, system-ui, sans-serif",
      }}
    >

      <main className="mx-auto w-full max-w-xl">
        {/* Header */}
        <header className="mb-6 flex items-center gap-3 px-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <ListChecks size={22} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            รายการงานของฉัน
          </h1>
        </header>

        {/* Add form */}
        <section className="mb-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-md">
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTodo()}
              placeholder="เพิ่มงานใหม่..."
              aria-label="เพิ่มงานใหม่"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-base text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none"
            />
            <button
              type="button"
              onClick={addTodo}
              disabled={!text.trim()}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 ${focusRing}`}
            >
              <Plus size={18} />
              เพิ่ม
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-500">ความสำคัญ</span>
            {ORDER.map((key) => {
              const p = PRIORITIES[key];
              const selected = priority === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPriority(key)}
                  aria-pressed={selected}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset transition-colors ${
                    selected
                      ? p.pick
                      : "bg-white text-slate-500 ring-slate-200 hover:bg-slate-50"
                  } ${focusRing}`}
                >
                  <span className={`h-2 w-2 rounded-full ${p.dot}`} />
                  {p.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Filter tabs */}
        <nav
          role="tablist"
          aria-label="กรองรายการงาน"
          className="mb-3 grid grid-cols-3 gap-1 rounded-xl bg-slate-200/60 p-1"
        >
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.key)}
                className={`rounded-lg px-2 py-2 text-sm font-medium transition-all ${
                  active
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                } ${focusRing}`}
              >
                {f.label}
                <span
                  className={`ml-1.5 text-xs ${active ? "text-slate-500" : "text-slate-400"}`}
                >
                  {counts[f.key]}
                </span>
              </button>
            );
          })}
        </nav>

        {/* List */}
        <ul className="mb-2">
          {visible.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
              onUpdate={updateTodo}
            />
          ))}
        </ul>

        {visible.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center text-slate-500">
            {EMPTY_TEXT[filter]}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-3 flex items-center justify-between gap-3 px-2">
          <p className="text-sm text-slate-600">
            เหลือ <span className="font-semibold text-slate-900">{remaining}</span> งาน
          </p>
          <button
            type="button"
            onClick={clearCompleted}
            disabled={completedCount === 0}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              completedCount === 0
                ? "cursor-not-allowed text-slate-300"
                : "text-rose-600 hover:bg-rose-50"
            } ${focusRing}`}
          >
            ล้างงานที่เสร็จแล้ว{completedCount > 0 ? ` (${completedCount})` : ""}
          </button>
        </footer>

        <p className="mt-6 text-center text-xs text-slate-400">
          ดับเบิลคลิกที่ข้อความเพื่อแก้ไข · คลิกป้ายความสำคัญเพื่อเปลี่ยนระดับ
        </p>
      </main>
    </div>
  );
}
