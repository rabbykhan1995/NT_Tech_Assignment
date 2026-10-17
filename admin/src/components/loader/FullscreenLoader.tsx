import { loadingStore } from "../../stores/loading.store";

export default function FullScreenLoader() {
  const { globalLoader } = loadingStore();

  if (!globalLoader) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-transparent"></div>

      <div className="fixed top-0 left-0 w-full z-50">
        <div
          className="h-[2px] bg-blue-500"
          style={{
            animation: "slideLoading 1.2s linear infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes slideLoading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(500%); }
        }
      `}</style>
    </>
  );
}