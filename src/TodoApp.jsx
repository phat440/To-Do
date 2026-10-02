import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Trash2,
  Check,
  Pencil,
  ListChecks,
  Search,
  X,
  Briefcase,
  User,
  ShoppingBag,
  HeartPulse,
  CalendarDays,
  AlertCircle,
  LayoutGrid,
} from "lucide-react";

/* ---------------------------------- Config --------------------------------- */

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

// Categories stay neutral on purpose: colour is reserved for priority and due dates.
const CATEGORIES = {
  work: { label: "งาน", Icon: Briefcase },
  personal: { label: "ส่วนตัว", Icon: User },
  shopping: { label: "ช้อปปิ้ง", Icon: ShoppingBag },
  health: { label: "สุขภาพ", Icon: HeartPulse },
};
const CAT_ORDER = ["work", "personal", "shopping", "health"];

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

const STATUS_COLORS = {
  done: "#1e293b",
  active: "#cbd5e1",
  overdue: "#ef4444",
};

const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1";

/* ------------------------------- Date helpers ------------------------------- */

const THAI_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

const pad = (n) => String(n).padStart(2, "0");
const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toDateStr(d);
};
const parseDate = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const diffDays = (a, b) => Math.round((parseDate(a) - parseDate(b)) / 86400000);
const formatDate = (s) => {
  const d = parseDate(s);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]}${sameYear ? "" : " " + (d.getFullYear() + 543)}`;
};

/* -------------------------------- Components -------------------------------- */

function PriorityBadge({ priority, onClick }) {
  const p = PRIORITIES[priority];
  return (
    <button
      type="button"
      onClick={onClick}
      title="คลิกเพื่อเปลี่ยนระดับความสำคัญ"
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors ${p.badge} ${focusRing}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} />
      {p.label}
    </button>
  );
}

function CategoryTag({ category }) {
  const { label, Icon } = CATEGORIES[category];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
      <Icon size={12} />
      {label}
    </span>
  );
}

function DueBadge({ due, done, today }) {
  if (!due) return null;
  const diff = diffDays(due, today);
  const base = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium";

  if (!done && diff < 0) {
    return (
      <span title={formatDate(due)} className={`${base} bg-red-600 text-white`}>
        <AlertCircle size={12} />
        เลยกำหนด {-diff} วัน
      </span>
    );
  }
  if (!done && diff === 0) {
    return (
      <span title={formatDate(due)} className={`${base} bg-yellow-300 text-yellow-900`}>
        <CalendarDays size={12} />
        ครบกำหนดวันนี้
      </span>
    );
  }
  return (
    <span className={`${base} bg-slate-100 text-slate-600`}>
      <CalendarDays size={12} />
      {!done && diff === 1 ? "พรุ่งนี้" : formatDate(due)}
    </span>
  );
}

function TodoItem({ todo, today, onToggle, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ text: todo.text, due: todo.due, category: todo.category });
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
    setDraft({ text: todo.text, due: todo.due, category: todo.category });
    setEditing(true);
  };

  const save = () => {
    const value = draft.text.trim();
    onUpdate(todo.id, {
      text: value || todo.text,
      due: draft.due,
      category: draft.category,
    });
    setEditing(false);
  };

  const cancel = () => setEditing(false);

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
          className={`rounded-xl border border-l-4 border-slate-100 bg-white px-3 py-3 shadow-sm sm:px-4 ${p.bar}`}
        >
          <div className="flex items-start gap-3">
            {/* Checkbox */}
            <button
              type="button"
              role="checkbox"
              aria-checked={todo.done}
              aria-label={todo.done ? "ทำเครื่องหมายว่ายังไม่เสร็จ" : "ทำเครื่องหมายว่าเสร็จแล้ว"}
              onClick={() => onToggle(todo.id)}
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                todo.done
                  ? "border-slate-800 bg-slate-800 text-white"
                  : "border-slate-300 bg-white text-transparent hover:border-slate-500"
              } ${focusRing}`}
            >
              <Check size={14} strokeWidth={3} />
            </button>

            {/* Text or edit panel */}
            <div className="min-w-0 flex-1">
              {editing ? (
                <div className="space-y-2">
                  <input
                    ref={inputRef}
                    value={draft.text}
                    onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") save();
                      if (e.key === "Escape") cancel();
                    }}
                    aria-label="แก้ไขงาน"
                    className="w-full rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-base text-slate-800 focus:border-slate-500 focus:outline-none"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="date"
                      value={draft.due}
                      onChange={(e) => setDraft({ ...draft, due: e.target.value })}
                      aria-label="วันที่ครบกำหนด"
                      className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                    />
                    <select
                      value={draft.category}
                      onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                      aria-label="หมวดหมู่"
                      className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                    >
                      {CAT_ORDER.map((k) => (
                        <option key={k} value={k}>
                          {CATEGORIES[k].label}
                        </option>
                      ))}
                    </select>
                    {draft.due && (
                      <button
                        type="button"
                        onClick={() => setDraft({ ...draft, due: "" })}
                        className={`rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 ${focusRing}`}
                      >
                        ล้างวันที่
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={save}
                      className={`inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-700 ${focusRing}`}
                    >
                      <Check size={14} />
                      บันทึก
                    </button>
                    <button
                      type="button"
                      onClick={cancel}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 ${focusRing}`}
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
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

            {/* Actions */}
            {!editing && (
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
            )}
          </div>

          {/* Meta badges */}
          {!editing && (
            <div className="mt-2 flex flex-wrap items-center gap-2 pl-9">
              <PriorityBadge priority={todo.priority} onClick={cyclePriority} />
              <CategoryTag category={todo.category} />
              <DueBadge due={todo.due} done={todo.done} today={today} />
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function CategoryFilter({ selected, onSelect, counts, total, variant }) {
  const items = [
    { key: "all", label: "ทั้งหมด", Icon: LayoutGrid, count: total },
    ...CAT_ORDER.map((k) => ({
      key: k,
      label: CATEGORIES[k].label,
      Icon: CATEGORIES[k].Icon,
      count: counts[k],
    })),
  ];

  if (variant === "chips") {
    return (
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="กรองตามหมวดหมู่">
        {items.map(({ key, label, Icon, count }) => {
          const active = selected === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              aria-pressed={active}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition-colors ${
                active
                  ? "bg-slate-900 text-white ring-slate-900"
                  : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
              } ${focusRing}`}
            >
              <Icon size={14} />
              {label}
              <span className={`text-xs ${active ? "text-slate-300" : "text-slate-400"}`}>{count}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-3 shadow-md">
      <h2 className="px-2 pb-2 pt-1 text-sm font-semibold text-slate-900">หมวดหมู่</h2>
      <div className="space-y-1" role="group" aria-label="กรองตามหมวดหมู่">
        {items.map(({ key, label, Icon, count }) => {
          const active = selected === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              aria-pressed={active}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                active
                  ? "bg-slate-900 font-semibold text-white"
                  : "text-slate-600 hover:bg-slate-100"
              } ${focusRing}`}
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              <span className={`text-xs ${active ? "text-slate-300" : "text-slate-400"}`}>{count}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Donut({ done, active, overdue }) {
  const total = done + active + overdue;
  const R = 40;
  const C = 2 * Math.PI * R;
  const segments = [
    { value: done, color: STATUS_COLORS.done },
    { value: active, color: STATUS_COLORS.active },
    { value: overdue, color: STATUS_COLORS.overdue },
  ].filter((s) => s.value > 0);

  let offset = 0;
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-24 w-24 shrink-0"
      role="img"
      aria-label={`เสร็จแล้ว ${done} ค้างอยู่ ${active} เลยกำหนด ${overdue}`}
    >
      <g transform="rotate(-90 50 50)">
        <circle cx="50" cy="50" r={R} fill="none" stroke="#f1f5f9" strokeWidth="12" />
        {total > 0 &&
          segments.map((s, i) => {
            const len = (s.value / total) * C;
            const el = (
              <circle
                key={i}
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth="12"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-offset}
                style={{ transition: "stroke-dasharray 400ms ease, stroke-dashoffset 400ms ease" }}
              />
            );
            offset += len;
            return el;
          })}
      </g>
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="16"
        fontWeight="700"
        fill="#0f172a"
      >
        {done}/{total}
      </text>
    </svg>
  );
}

function StatsCard({ total, done, active, overdue }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  const legend = [
    { label: "เสร็จแล้ว", value: done, color: STATUS_COLORS.done },
    { label: "ค้างอยู่", value: active, color: STATUS_COLORS.active },
    { label: "เลยกำหนด", value: overdue, color: STATUS_COLORS.overdue },
  ];

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-md">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">สถิติ</h2>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-2xl font-bold text-slate-900">{total}</p>
          <p className="text-xs text-slate-500">งานทั้งหมด</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{pct}%</p>
          <p className="text-xs text-slate-500">เสร็จแล้ว</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Donut done={done} active={active} overdue={overdue} />
        <ul className="min-w-0 flex-1 space-y-1.5">
          {legend.map((l) => (
            <li key={l.label} className="flex items-center gap-2 text-sm text-slate-600">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: l.color }}
              />
              <span className="flex-1">{l.label}</span>
              <span className="font-semibold text-slate-900">{l.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------ App ----------------------------------- */

export default function TodoApp() {
  const nextId = useRef(7);
  const [todos, setTodos] = useState(() => [
    { id: 1, text: "ส่งรายงานประจำเดือนให้หัวหน้า", done: false, priority: "high", category: "work", due: addDays(-2) },
    { id: 2, text: "โทรนัดหมอฟัน", done: false, priority: "medium", category: "health", due: addDays(0) },
    { id: 3, text: "ซื้อของเข้าบ้านที่ตลาด", done: true, priority: "low", category: "shopping", due: addDays(-1) },
    { id: 4, text: "จองตั๋วรถไปเยี่ยมที่บ้าน", done: false, priority: "medium", category: "personal", due: addDays(5) },
    { id: 5, text: "ประชุมทีมวางแผนไตรมาสหน้า", done: false, priority: "medium", category: "work", due: addDays(1) },
    { id: 6, text: "ออกกำลังกายสัปดาห์ละสามวัน", done: false, priority: "low", category: "health", due: "" },
  ]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("personal");
  const [due, setDue] = useState("");
  const [filter, setFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [query, setQuery] = useState("");

  const today = toDateStr(new Date());

  const addTodo = () => {
    const value = text.trim();
    if (!value) return;
    setTodos((prev) => [
      { id: nextId.current++, text: value, done: false, priority, category, due, fresh: true },
      ...prev,
    ]);
    setText("");
    setDue("");
  };

  const toggleTodo = (id) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done, fresh: false } : t)));

  const updateTodo = (id, patch) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch, fresh: false } : t)));

  const removeWithAnimation = (ids) => {
    setTodos((prev) => prev.map((t) => (ids.includes(t.id) ? { ...t, removing: true } : t)));
    setTimeout(() => {
      setTodos((prev) => prev.filter((t) => !ids.includes(t.id)));
    }, 300);
  };

  const deleteTodo = (id) => removeWithAnimation([id]);
  const clearCompleted = () => removeWithAnimation(todos.filter((t) => t.done).map((t) => t.id));

  /* Derived data */
  const live = todos.filter((t) => !t.removing);
  const q = query.trim().toLowerCase();

  const inScope = todos.filter(
    (t) =>
      (catFilter === "all" || t.category === catFilter) &&
      (!q || t.text.toLowerCase().includes(q))
  );
  const visible = inScope.filter((t) =>
    filter === "active" ? !t.done : filter === "completed" ? t.done : true
  );
  const tabCounts = {
    all: inScope.filter((t) => !t.removing).length,
    active: inScope.filter((t) => !t.removing && !t.done).length,
    completed: inScope.filter((t) => !t.removing && t.done).length,
  };

  const catCounts = Object.fromEntries(
    CAT_ORDER.map((k) => [k, live.filter((t) => t.category === k).length])
  );

  const total = live.length;
  const doneCount = live.filter((t) => t.done).length;
  const overdueCount = live.filter((t) => !t.done && t.due && t.due < today).length;
  const activeCount = total - doneCount - overdueCount;
  const remaining = total - doneCount;

  const emptyMessage = q
    ? `ไม่พบงานที่ตรงกับ “${query.trim()}”`
    : catFilter !== "all" && filter === "all"
    ? `ยังไม่มีงานในหมวด${CATEGORIES[catFilter].label}`
    : EMPTY_TEXT[filter];

  const stats = { total, done: doneCount, active: activeCount, overdue: overdueCount };

  return (
    <div
      className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:py-14"
      style={{
        fontFamily:
          "'Noto Sans Thai', 'Sarabun', 'Leelawadee UI', Tahoma, system-ui, sans-serif",
      }}
    >

      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <header className="mb-6 flex items-center gap-3 px-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <ListChecks size={22} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">รายการงานของฉัน</h1>
        </header>

        <div className="flex flex-col lg:flex-row lg:items-start lg:gap-6">
          {/* Sidebar (desktop) */}
          <aside className="hidden w-64 shrink-0 space-y-4 lg:sticky lg:top-8 lg:block">
            <CategoryFilter
              variant="list"
              selected={catFilter}
              onSelect={setCatFilter}
              counts={catCounts}
              total={total}
            />
            <StatsCard {...stats} />
          </aside>

          {/* Main column */}
          <main className="min-w-0 flex-1">
            {/* Add form */}
            <section className="mb-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-md">
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

              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-20 shrink-0 text-sm text-slate-500">ความสำคัญ</span>
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
                          selected ? p.pick : "bg-white text-slate-500 ring-slate-200 hover:bg-slate-50"
                        } ${focusRing}`}
                      >
                        <span className={`h-2 w-2 rounded-full ${p.dot}`} />
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-20 shrink-0 text-sm text-slate-500">หมวดหมู่</span>
                  {CAT_ORDER.map((key) => {
                    const { label, Icon } = CATEGORIES[key];
                    const selected = category === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setCategory(key)}
                        aria-pressed={selected}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset transition-colors ${
                          selected
                            ? "bg-slate-900 text-white ring-slate-900"
                            : "bg-white text-slate-500 ring-slate-200 hover:bg-slate-50"
                        } ${focusRing}`}
                      >
                        <Icon size={14} />
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label htmlFor="due-date" className="w-20 shrink-0 text-sm text-slate-500">
                    ครบกำหนด
                  </label>
                  <input
                    id="due-date"
                    type="date"
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                  />
                  {due && (
                    <button
                      type="button"
                      onClick={() => setDue("")}
                      aria-label="ล้างวันที่"
                      className={`rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 ${focusRing}`}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Search */}
            <div className="relative mb-3">
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหางาน..."
                aria-label="ค้นหางาน"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-base text-slate-800 placeholder-slate-400 shadow-sm focus:border-slate-400 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="ล้างคำค้นหา"
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 ${focusRing}`}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Category chips (mobile / tablet) */}
            <div className="mb-3 lg:hidden">
              <CategoryFilter
                variant="chips"
                selected={catFilter}
                onSelect={setCatFilter}
                counts={catCounts}
                total={total}
              />
            </div>

            {/* Status tabs */}
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
                      active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    } ${focusRing}`}
                  >
                    {f.label}
                    <span className={`ml-1.5 text-xs ${active ? "text-slate-500" : "text-slate-400"}`}>
                      {tabCounts[f.key]}
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
                  today={today}
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                  onUpdate={updateTodo}
                />
              ))}
            </ul>

            {visible.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center text-slate-500">
                {emptyMessage}
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
                disabled={doneCount === 0}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  doneCount === 0 ? "cursor-not-allowed text-slate-300" : "text-rose-600 hover:bg-rose-50"
                } ${focusRing}`}
              >
                ล้างงานที่เสร็จแล้ว{doneCount > 0 ? ` (${doneCount})` : ""}
              </button>
            </footer>

            {/* Stats (mobile / tablet) */}
            <div className="mt-6 lg:hidden">
              <StatsCard {...stats} />
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              ดับเบิลคลิกที่ข้อความเพื่อแก้ไข · คลิกป้ายความสำคัญเพื่อเปลี่ยนระดับ
            </p>
          </main>
        </div>
      </div>
    </div>
  );
}
