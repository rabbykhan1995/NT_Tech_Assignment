import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router";
import {
  LogOut,
  Menu,
  X,

  ChevronRight,
  TextAlignCenter,
} from "lucide-react";

import { dashboardStore } from "../../stores/dashboard.store";
import Helper from "../../utils/helper";
import DarkLightToggle from "../buttons/DarkLightToggle";
import LanguageToggle from "../buttons/LanguageToggle";
import { AdminRoutes } from "../../routes/admin.routes";
import { userStore } from "../../stores/user.store";
import { languageStore } from "../../stores/language.store";


export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [activeSubmenu, setActiveSubmenu] = useState<number | null>(null);
  const { sidePanel, setSidePanel } = dashboardStore();
  const mobileSidePanelRef = useRef<HTMLDivElement | null>(null);
  const { logout } = userStore();
  const { language } = languageStore();
  const { user } = userStore();
  const t = (name: string, nameBn?: string): string =>
    language === "bn" ? nameBn ?? name : name;
  
useEffect(() => {
  document.documentElement.lang = language;
}, [language]);

  const filteredRoutes = AdminRoutes
    .map((item) => {
      // Parent-এর permission থাকলে check
      if (item.permission && !Helper.isPermitter(item.permission)) {
        return null;
      }

      // Sub items filter
      if (item.subItems) {
        const allowedSubItems = item.subItems.filter(
          (subItem) =>
            !subItem.permission ||
            Helper.isPermitter(subItem.permission)
        );

        // কোনো sub item accessible না হলে parent-ও hide
        if (allowedSubItems.length === 0) {
          return null;
        }

        return {
          ...item,
          subItems: allowedSubItems,
        };
      }

      return item;
    })
    .filter(Boolean);

  const handleLogout = (): void => {
    Helper.clearToken();
    logout();
  };

  const toggleSubmenu = (index: number): void => {
    setActiveSubmenu((prev) => (prev === index ? null : index));
  };

  const navItems = filteredRoutes;

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);


  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        mobileOpen &&
        mobileSidePanelRef.current &&
        !mobileSidePanelRef.current.contains(event.target as Node)
      ) {
        setMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [mobileOpen]);

  return (
    <div className="text-[rgb(var(--primary-text))]">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 w-full flex items-center justify-between px-4 py-3 z-50 border-b border-[rgb(var(--primary-border))] bg-[rgb(var(--primary-bg))]">

        {!sidePanel && <button
          onClick={() => setSidePanel(!sidePanel)}
          className="global_button bg-amber-50 text-black hidden lg:block"
        >
          <TextAlignCenter size={20} />
        </button>}


        <div className="lg:hidden items-center gap-3 flex">
          <LanguageToggle />
          <DarkLightToggle />

          <button
            onClick={handleLogout}
            className="cursor-pointer"
            title="Logout"
          >
            <LogOut size={20} />
          </button>


        </div>
        <h1 className="text-lg font-bold lg:block hidden">{user?.name}</h1>
        <div className="lg:flex items-center gap-3 hidden">
          <LanguageToggle />
          <DarkLightToggle />

          <button
            onClick={handleLogout}
            className="cursor-pointer"
            title="Logout"
          >
            <LogOut size={20} />
          </button>


        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

{/* Mobile Sidebar */}
      <div
        ref={mobileSidePanelRef}
        className={`lg:hidden font-medium fixed border-r dark:border-gray-500 border-gray-200 top-0 bg-[rgb(var(--primary-bg))] left-0 pt-16 h-[100dvh] w-64 z-40 transition-transform duration-300 flex flex-col justify-between ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Nav Items Container (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 font-semibold text-sm">
          <ul className="space-y-1">
            {navItems.map((item, index) => (
              <li key={index}>
                {item!.subItems ? (
                  <>
                    <div
                      onClick={() => toggleSubmenu(index)}
                      className="flex items-center justify-between cursor-pointer px-3 py-2 rounded-md hover:bg-orange-500"
                    >
                      <div className="flex items-center gap-3">
                        {item!.icon}
                        {t(item!.name, item!.nameBn)}
                      </div>
                      <ChevronRight
                        size={18}
                        className={`transition-all duration-300 ease-in-out ${
                          activeSubmenu === index ? "rotate-90" : ""
                        }`}
                      />
                    </div>

                    {activeSubmenu === index && (
                      <ul className="ml-8 mt-2 space-y-2">
                        {item!.subItems.map((sub, i) => (
                          <li key={i}>
                            <NavLink
                              to={sub.link}
                              className={({ isActive }) =>
                                `flex items-center gap-2 px-2 py-2 text-sm rounded-md ${
                                  isActive ? "bg-orange-600" : "hover:bg-orange-500"
                                }`
                              }
                              onClick={() => setMobileOpen(false)}
                            >
                              {sub.icon}
                              {t(sub.name, sub.nameBn)}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <NavLink
                    to={item!.link!}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-md ${
                        isActive ? "bg-orange-600" : "hover:bg-orange-500"
                      }`
                    }
                    onClick={() => setMobileOpen(false)}
                  >
                    {item!.icon}
                    {t(item!.name, item!.nameBn)}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Owner name Footer at Bottom (Non-scrollable, fixed at bottom) */}
        <div className="p-4 border-t dark:border-gray-500 border-gray-200 bg-[rgb(var(--primary-bg))] shrink-0">
          <h1 className="text-sm font-bold truncate">
            {user?.name || "Admin"}
          </h1>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div
        className={`hidden lg:flex flex-col  font-medium fixed top-0 left-0 pt-16 h-screen bg-[rgb(var(--primary-bg))]  transition-all duration-300 overflow-hidden ${sidePanel ? "w-[260px]" : "w-0"
          }`}
      >
        <div
          // className={`hidden lg:block fixed top-16 z-50 transition-all duration-300 ${
          //   sidePanel ? "left-[260px]" : "left-0"
          // }`}
          className="flex justify-end w-full"
        >
          <button
            onClick={() => setSidePanel(!sidePanel)}
            className="global_button  mr-4"
          >
            <TextAlignCenter size={20} />
          </button>
        </div>
        <ul className="overflow-y-auto h-[calc(100vh-4rem)] p-4 space-y-3">
          {navItems.map((item, index) => (
            <li key={index}>
              {item!.subItems ? (
                <>
                  <div
                    onClick={() => toggleSubmenu(index)}
                    className="flex items-center justify-between cursor-pointer px-3 py-2 rounded-md hover:bg-orange-500"
                  >
                    <div className="flex items-center gap-3">
                      {item!.icon}
                      {t(item!.name, item!.nameBn)}
                    </div>
                    <ChevronRight
                      size={18}
                      className={`transition-all duration-300 ${activeSubmenu === index ? "rotate-90" : ""
                        }`}
                    />
                  </div>

                  {activeSubmenu === index && (
                    <ul className="ml-8 mt-2 space-y-2">
                      {item!.subItems.map((sub, i) => (
                        <li key={i}>
                          <NavLink
                            to={sub.link}
                            className={({ isActive }) =>
                              `flex items-center gap-2 px-2 py-2 text-sm rounded-md ${isActive ? "bg-orange-600" : "hover:bg-orange-500"
                              }`
                            }

                          >
                            {sub.icon}
                            {t(sub.name, sub.nameBn)}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <NavLink
                  to={item!.link!}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md ${isActive ? "bg-orange-600" : "hover:bg-orange-500"
                    }`
                  }
                >
                  {item!.icon}
                  {t(item!.name, item!.nameBn)}
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </div>


    </div>
  );
}