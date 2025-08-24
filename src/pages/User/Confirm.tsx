interface Props {
  open: boolean;
  name?: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}
export default function DeleteConfirm({
  open,
  name,
  onClose,
  onConfirm,
}: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 text-black">
      <div className="w-full max-w-md rounded-lg bg-white shadow">
        <div className="border-b px-6 py-4">
          <h3 className="text-lg font-semibold text-black">Delete User</h3>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-700">
            Apakah Anda yakin ingin menghapus {" "}
            <span className="font-medium">{name}</span>?
          </p>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-4">
          <button
            className="rounded-md border px-4 py-2 text-sm"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            onClick={async () => {
              await onConfirm();
              onClose();
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
