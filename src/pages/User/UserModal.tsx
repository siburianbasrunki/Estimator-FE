import { useEffect, useState } from "react";
import type {
  CreateUserInput,
  UpdateUserInput,
  User,
  Role,
} from "../../model/user";

interface Props {
  open: boolean;
  mode: "create" | "edit";
  initial?: User | null;
  onClose: () => void;
  onSubmit: (
    payload: CreateUserInput | UpdateUserInput
  ) => Promise<void> | void;
}

const roles: Role[] = ["USER", "ADMIN"];

export default function UserModal({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
}: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [role, setRole] = useState<Role>((initial?.role as Role) ?? "USER");
  const [phoneNumber, setPhoneNumber] = useState(initial?.phoneNumber ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setEmail(initial?.email ?? "");
      setRole((initial?.role as Role) ?? "USER");
      setPhoneNumber(initial?.phoneNumber ?? "");
      setFile(null);
    }
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "create") {
        await onSubmit({ name, email, role, phoneNumber, file });
      } else {
        await onSubmit({ name, role, phoneNumber, file });
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 text-black" >
      <div className="w-full max-w-lg rounded-lg bg-white shadow">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-semibold text-black">
            {mode === "create" ? "Create User" : "Edit User"}
          </h3>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Name</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-black"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-black"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              disabled={mode === "edit"}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Role</label>
              <select
                className="w-full rounded-md border px-3 py-2 text-black"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Phone</label>
              <input
                className="w-full rounded-md border px-3 py-2 text-black"
                value={phoneNumber || ""}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Avatar (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm outline-none file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700 disabled:opacity-60"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
