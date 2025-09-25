import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HiDotsVertical } from "react-icons/hi";
import { IoDocument } from "react-icons/io5";
import { BiEdit, BiTrash } from "react-icons/bi";

type RowActionsProps = {
  id: string;
  name?: string;
  isDeleting?: boolean;
  onDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

type Coords = { top: number; left: number };

export const RowActions: React.FC<RowActionsProps> = ({
  id,
  name,
  isDeleting,
  onDetail,
  onEdit,
  onDelete,
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const computePosition = () => {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    setCoords({ top: r.bottom + 6, left: r.right });
  };

  useLayoutEffect(() => {
    if (open) computePosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => computePosition();
    const onResize = () => computePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(t) &&
        btnRef.current &&
        !btnRef.current.contains(t)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative inline-block text-left">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Actions"
        onClick={() => setOpen((o) => !o)}
        className="p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <HiDotsVertical className="h-5 w-5 text-gray-600" />
      </button>

      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={`Actions for ${name || id}`}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              transform: "translateX(-100%)",
              zIndex: 10000,
            }}
            className="z-[10000] w-44 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none"
          >
            <div className="py-1">
              <button
                role="menuitem"
                onClick={() => {
                  onDetail();
                  setOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <IoDocument className="h-4 w-4 text-blue-600" />
                <span>Detail</span>
              </button>

              <button
                role="menuitem"
                onClick={() => {
                  onEdit();
                  setOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <BiEdit className="h-4 w-4 text-green-600" />
                <span>Edit</span>
              </button>

              <button
                role="menuitem"
                disabled={isDeleting}
                onClick={() => {
                  if (!isDeleting) onDelete();
                  setOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                  isDeleting
                    ? "text-red-300 cursor-not-allowed"
                    : "text-red-700 hover:bg-red-50"
                }`}
              >
                <BiTrash className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
