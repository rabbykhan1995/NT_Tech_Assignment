import { Outlet, useLocation } from "react-router";

import DahboardLayout from "../components/dashboard/DahboardLayout";
import FullScreenLoader from "../components/loader/FullscreenLoader";
import Chatbot from "../components/chatbot/Chatbot";

import { dashboardStore } from "../stores/dashboard.store";
import { useEffect } from "react";

export default function RootLayout() {
  const { sidePanel } = dashboardStore();
  const location = useLocation();
  const isPosSale = location.pathname === "/sale/fifo-sale";

    useEffect(() => {
      const handleWheel = () => {
        const activeEl = document.activeElement as HTMLInputElement | null;
  
        // check if the active element is a number input
        if (activeEl && activeEl.type === "number") {
          activeEl.blur(); // remove focus to prevent scroll change
        }
      };
      window.addEventListener("wheel", handleWheel, { passive: true });
      return () => window.removeEventListener("wheel", handleWheel);
    }, []);
// eta pos sale show korbe only
  if (isPosSale) {
    return (
      <div className={`min-h-screen bg-[#f4fffe] dark:bg-[rgb(var(--primary-bg))] transition-all duration-300 text-[rgb(var(--primary-text))]`}>
        <Outlet />
        <FullScreenLoader />
        <Chatbot />
      </div>
    );
  }
// eta pos sale baade
  return (
    <div className={`min-h-screen transition-all duration-300 text-[rgb(var(--primary-text))] ${sidePanel ? "lg:pl-[260px]" : "lg:pl-0"
      }`}>
      {/* Sidebar — fixed, তাই grid এ রাখার দরকার নেই */}
      <DahboardLayout />

      {/* Main Content */}
      <div className="flex flex-col min-h-screen overflow-y-auto bg-[#f8faef] dark:bg-[#1d1d1d]">
        <div className="lg:pt-18 pt-14 px-2">
          <Outlet />
          <FullScreenLoader />
          <Chatbot />
        </div>
      </div>
    </div>
  );
}