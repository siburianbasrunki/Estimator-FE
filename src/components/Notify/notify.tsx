import React, { createContext, useCallback, useContext, useState } from "react";
import Portal from "../Portal";

type Variant = "success" | "error" | "info";
type Toast = { id: string; message: string; variant: Variant };

type Ctx = {
  notify: (message: string, variant?: Variant) => void;
};

const NotifyContext = createContext<Ctx | null>(null);

export const useNotify = () => {
  const ctx = useContext(NotifyContext);
  if (!ctx) throw new Error("useNotify must be used within <NotifyProvider />");
  return ctx.notify;
};

export const NotifyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, variant: Variant = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <NotifyContext.Provider value={{ notify }}>
      {children}
      <Portal>
        <div className="fixed top-4 right-4 z-[9999] space-y-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={[
                "rounded-lg px-4 py-3 shadow-lg border text-sm",
                "bg-white/80 backdrop-blur-sm",
                t.variant === "success" && "border-emerald-200",
                t.variant === "error" && "border-red-200",
                t.variant === "info" && "border-indigo-200",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div
                className={[
                  "font-medium",
                  t.variant === "success" && "text-emerald-700",
                  t.variant === "error" && "text-red-700",
                  t.variant === "info" && "text-indigo-700",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {t.message}
              </div>
            </div>
          ))}
        </div>
      </Portal>
    </NotifyContext.Provider>
  );
};
