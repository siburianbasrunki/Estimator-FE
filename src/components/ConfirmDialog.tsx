import React, { createContext, useCallback, useContext, useState } from "react";
import Portal from "./Portal";

type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "default";
};

type ConfirmContextType = {
  confirm: (opts?: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx)
    throw new Error("useConfirm must be used within <ConfirmProvider />");
  return ctx.confirm;
};

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((v: boolean) => void) | null>(null);

  const confirm = useCallback((options?: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setOpts(options || {});
      setResolver(() => resolve);
      setOpen(true);
    });
  }, []);

  const handleClose = (val: boolean) => {
    setOpen(false);
    resolver?.(val);
    setResolver(null);
  };

  const {
    title = "Konfirmasi",
    description = "Apakah Anda yakin?",
    confirmText = "Ya",
    cancelText = "Batal",
    variant = "default",
  } = opts || {};

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {open && (
        <Portal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-200/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              <p className="mt-2 text-sm text-gray-600">{description}</p>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() => handleClose(false)}
                  className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => handleClose(true)}
                  className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${
                    variant === "danger"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </ConfirmContext.Provider>
  );
};
