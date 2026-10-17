import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import LazySelect from "../Ui/LazySelect";
import { getReactSelectStyles } from "../../utils/reactSelectStyles";

export type ExtraField = {
  key: string;
  label: string;
  type?: "text" | "number" | "select" | "toggle";
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  defaultValue?: string;
};

type CreateEntityModalProps = {
  isOpen: boolean;
  title: string;
  label?: string;
  initialName?: string;
  submitLabel?: string;
  loading?: boolean;
  fields?: ExtraField[];
  onClose: () => void;
  onSubmit: (values: { name: string; fields: Record<string, string> }) => void;
};

function buildInitialValues(fields: ExtraField[]): Record<string, string> {
  const init: Record<string, string> = {};
  fields.forEach((f) => {
    if (f.type === "toggle") {
      init[f.key] = f.defaultValue ?? "false";
    } else if (f.defaultValue !== undefined) {
      init[f.key] = f.defaultValue;
    }
  });
  return init;
}

export default function CreateEntityModal({
  isOpen,
  title,
  label = "Name",
  initialName = "",
  submitLabel = "Create",
  loading = false,
  fields = [],
  onClose,
  onSubmit,
}: CreateEntityModalProps) {
  const [name, setName] = useState(initialName);
  const [values, setValues] = useState<Record<string, string>>(() =>
    buildInitialValues(fields)
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmed = name.trim();
  const missingRequired = fields
    .filter((f) => f.required && f.type !== "toggle")
    .some((f) => !(values[f.key] ?? "").trim());
  const canSubmit = trimmed.length > 0 && !missingRequired && !loading;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ name: trimmed, fields: values });
  };

  const setValue = (key: string, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 dark:text-white">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-[#202020] p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition dark:hover:bg-neutral-700 dark:hover:text-gray-200"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">{label}</label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder={label}
            className="global_input"
          />

          {fields.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {fields.map((f) => (
                <div
                  key={f.key}
                  className={f.type === "toggle" ? "col-span-1 sm:col-span-2" : ""}
                >
                  {f.type === "toggle" ? (
                    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={values[f.key] === "true"}
                        onChange={() =>
                          setValue(
                            f.key,
                            values[f.key] === "true" ? "false" : "true"
                          )
                        }
                        className="accent-blue-600 w-4 h-4"
                      />
                      {f.label}
                    </label>
                  ) : (
                    <>
                      <label className="block text-sm font-medium mb-1">
                        {f.label}
                        {f.required && <span className="text-red-500"> *</span>}
                      </label>
                      {f.type === "select" ? (
                        <LazySelect<{ value: string; label: string }>
                          value={
                            values[f.key]
                              ? (f.options ?? []).find((o) => o.value === values[f.key]) ?? null
                              : null
                          }
                          onChange={(opt) => setValue(f.key, opt?.value ?? "")}
                          options={f.options ?? []}
                          placeholder={"Select " + f.label}
                          isClearable
                          isSearchable
                          className="react-select-custom"
                          menuPortalTarget={document.body}
                          styles={getReactSelectStyles<{ value: string; label: string }>()}
                        />
                      ) : (
                        <input
                          type={f.type === "number" ? "number" : "text"}
                          value={values[f.key] ?? ""}
                          onChange={(e) => setValue(f.key, e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                          placeholder={f.placeholder ?? f.label}
                          className="global_input"
                        />
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="global_button_red">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="global_button h-full"
          >
            {loading ? "Creating..." : submitLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
