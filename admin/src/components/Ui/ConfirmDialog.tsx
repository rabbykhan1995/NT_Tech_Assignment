import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";
import { useConfirmStore } from "../../stores/confirm.store";
import { languageStore } from "../../stores/language.store";

export default function ConfirmDialog() {
  const isOpen = useConfirmStore((s) => s.isOpen);
  const options = useConfirmStore((s) => s.options);
  const closeConfirm = useConfirmStore((s) => s.closeConfirm);
  const { language } = languageStore();
  const t = (en: string, bn: string): string => (language === "bn" ? bn : en);

  const {
    title = t("Are you sure?", "আপনি কি নিশ্চিত?"),
    message,
    confirmLabel = t("Confirm", "নিশ্চিত করুন"),
    cancelLabel = t("Cancel", "বাতিল"),
    danger = true,
  } = options;

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeConfirm(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeConfirm]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => closeConfirm(false)}
      />
      <div className="relative w-full max-w-sm rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-[#202020] p-5 shadow-2xl">
        <button
          onClick={() => closeConfirm(false)}
          className="absolute right-3 top-3 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition dark:hover:bg-neutral-700 dark:hover:text-gray-200"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`shrink-0 rounded-full p-2.5 ${
              danger
                ? "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"
                : "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
            }`}
          >
            <AlertTriangle size={24} />
          </div>
          <div className="min-w-0 pt-0.5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            {message && (
              <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400 break-words">
                {message}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => closeConfirm(false)}
            className="rounded-md border border-gray-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700 transition cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => closeConfirm(true)}
            autoFocus
            className={`rounded-md px-4 py-2 text-sm font-semibold text-white shadow-md transition cursor-pointer ${
              danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[rgb(var(--global-button-bg))] hover:bg-[rgb(var(--global-button-hover))]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}