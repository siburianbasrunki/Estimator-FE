import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import { BiChevronDown, BiSearch, BiX } from "react-icons/bi";

export type Option = { label: string; value: string; [key: string]: any };

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
  filterFn?: (opt: Option, q: string) => boolean;
  isButton?: ReactNode;
  /** Render dropdown ke body (hindari clipping) */
  portal?: boolean;
  /** Z-index untuk panel dropdown (saat portal) */
  zIndex?: number;
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
  isButton,
  portal = true,
  zIndex = 1000,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [activeIdx, setActiveIdx] = useState<number>(-1);

  // posisi dropdown saat portal
  const [panelRect, setPanelRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const current = useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return options;

    const f: (opt: Option, q: string) => boolean =
      filterFn ??
      ((opt: Option, qArg: string) =>
        (opt.label ?? "").toLowerCase().includes(qArg) ||
        (opt.value ?? "").toLowerCase().includes(qArg));

    return options.filter((o) => f(o, query));
  }, [options, q, filterFn]);

  // close on outside click (wrapper + panel portal)
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!open) return;
      const target = e.target as Node;
      const insideWrapper = wrapperRef.current?.contains(target);
      const insidePanel = panelRef.current?.contains(target);
      if (!insideWrapper && !insidePanel) {
        setOpen(false);
        setQ("");
        setActiveIdx(-1);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  useEffect(() => {
    if (activeIdx >= filtered.length) setActiveIdx(filtered.length - 1);
  }, [filtered.length, activeIdx]);

  useEffect(() => {
    if (!listRef.current || activeIdx < 0) return;
    const el = listRef.current.querySelectorAll<HTMLLIElement>("li")[activeIdx];
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  // Hitung posisi dropdown saat open/resize/scroll
  const recalcPosition = () => {
    if (!portal || !wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    setPanelRect({ top: rect.bottom, left: rect.left, width: rect.width });
  };

  useLayoutEffect(() => {
    if (open) {
      recalcPosition();
      // Fokuskan input search
      setTimeout(() => inputRef.current?.focus(), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || !portal) return;
    const onResize = () => recalcPosition();
    const onScroll = () => recalcPosition();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true); // true untuk menangkap scroll container juga
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, portal]);

  const sizeClasses =
    size === "sm"
      ? "text-sm py-2 min-h-[36px]"
      : "text-[15px] py-3 min-h-[44px]";
  const disabledCls = disabled ? "pointer-events-none opacity-60" : "";

  const showClear = !!(clearable && current && !disabled);
  const rightPadCls = showClear ? "pr-16" : "pr-10";

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

  const PanelInner = (
    <div
      ref={panelRef}
      className="rounded-xl border border-gray-200 bg-white shadow-xl text-black"
      style={
        portal
          ? {
              position: "fixed",
              top: panelRect?.top ?? 0,
              left: panelRect?.left ?? 0,
              width: panelRect?.width ?? undefined,
              zIndex,
            }
          : { zIndex }
      }
    >
      {/* Search box */}
      <div className="p-2 border-b border-gray-200">
        <div className="relative">
          <BiSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            ref={inputRef}
            className={`input input-bordered w-full pl-8 pr-2 text-black bg-white border-black ${
              size === "sm" ? "input-sm" : ""
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
      <ul ref={listRef} role="listbox" className="max-h-64 overflow-auto py-1">
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
                <div className="whitespace-normal break-words leading-snug">
                  {opt.label}
                </div>
              </li>
            );
          })
        )}
      </ul>

      {isButton && (
        <div className="p-2 border-t border-gray-200">{isButton}</div>
      )}
    </div>
  );

  return (
    <div
      ref={wrapperRef}
      className={`relative ${className} text-black`}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className={`input input-bordered w-full ${rightPadCls} text-black bg-white border-black flex items-start justify-between h-auto ${sizeClasses} ${disabledCls}`}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className={`block text-left whitespace-normal break-words leading-snug ${
            current ? "" : "text-gray-500"
          }`}
        >
          {current ? current.label : placeholder}
        </span>
        <BiChevronDown className="text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </button>

      {/* Clear button */}
      {clearable && current && !disabled && (
        <button
          type="button"
          className="absolute right-9 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100"
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

      {/* Panel */}
      {open &&
        (portal ? (
          createPortal(PanelInner, document.body)
        ) : (
          <div className="absolute mt-1 w-full" style={{ zIndex }}>
            {PanelInner}
          </div>
        ))}
    </div>
  );
}
