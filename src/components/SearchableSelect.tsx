// components/SearchableSelect.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { BiChevronDown, BiSearch, BiX } from "react-icons/bi";

export type Option = {
  label: string;
  value: string;
  // optional field for passing through
  [key: string]: any;
};

type Props = {
  options: Option[];
  value?: string;
  onChange: (value: string | undefined, option?: Option) => void;
  placeholder?: string;
  emptyText?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
  clearable?: boolean;
  /** custom filter, default: label/value includes q (case-insensitive) */
  filterFn?: (opt: Option, q: string) => boolean;
};

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Pilih...",
  emptyText = "Tidak ada data",
  loading = false,
  disabled = false,
  className = "",
  size = "md",
  clearable = true,
  filterFn,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [activeIdx, setActiveIdx] = useState<number>(-1);

  const current = useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return options;
    const f = filterFn
      ? filterFn
      : (opt: Option, _q: string) =>
          (opt.label ?? "").toLowerCase().includes(query) ||
          (opt.value ?? "").toLowerCase().includes(query);
    return options.filter((o) => f(o, query));
  }, [options, q, filterFn]);

  // close on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQ("");
        setActiveIdx(-1);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // ensure active index within bounds
  useEffect(() => {
    if (activeIdx >= filtered.length) setActiveIdx(filtered.length - 1);
  }, [filtered.length, activeIdx]);

  // auto scroll into view when activeIdx changes
  useEffect(() => {
    if (!listRef.current || activeIdx < 0) return;
    const el = listRef.current.querySelectorAll<HTMLLIElement>("li")[activeIdx];
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const sizeClasses =
    size === "sm" ? "input-sm h-9 text-sm" : "h-11 text-[15px]"; // daisy keeps base sizing via .input

  const disabledCls = disabled ? "pointer-events-none opacity-60" : "";

  const handlePick = (opt: Option) => {
    onChange(opt?.value, opt);
    setOpen(false);
    setQ("");
    setActiveIdx(-1);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (
      !open &&
      (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter")
    ) {
      setOpen(true);
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min((i ?? -1) + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max((i ?? filtered.length) - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[activeIdx]) handlePick(filtered[activeIdx]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setQ("");
      setActiveIdx(-1);
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={`relative ${className} text-black`}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className={`input input-bordered w-full pr-10 text-black bg-white border-black flex items-center justify-between ${sizeClasses} ${disabledCls}`}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className={`truncate text-left ${current ? "" : "text-gray-500"}`}
        >
          {current ? current.label : placeholder}
        </span>
        <BiChevronDown className="text-gray-500 absolute right-3 pointer-events-none" />
      </button>

      {/* Clear button */}
      {clearable && current && !disabled && (
        <button
          type="button"
          className={`absolute right-9 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100`}
          onClick={(e) => {
            e.stopPropagation();
            onChange(undefined, undefined);
            setQ("");
            setActiveIdx(-1);
            setOpen(false);
          }}
          aria-label="Clear"
          title="Clear"
        >
          <BiX className="text-gray-600" />
        </button>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-xl">
          {/* Search box */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <BiSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                ref={inputRef}
                className={`input input-bordered w-full pl-8 pr-2 text-black bg-white border-black ${
                  size === "sm" ? "input-sm h-9" : ""
                }`}
                placeholder="Ketik untuk mencari..."
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setActiveIdx(0);
                }}
              />
            </div>
          </div>

          {/* List */}
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-64 overflow-auto py-1"
          >
            {loading ? (
              <li className="px-3 py-2 text-sm text-black">Memuat...</li>
            ) : filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-black">{emptyText}</li>
            ) : (
              filtered.map((opt, idx) => {
                const active = idx === activeIdx;
                const selected = value === opt.value;
                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={selected}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handlePick(opt)}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                      active ? "bg-gray-100" : ""
                    } ${selected ? "font-medium" : ""}`}
                  >
                    <div className="truncate">{opt.label}</div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
