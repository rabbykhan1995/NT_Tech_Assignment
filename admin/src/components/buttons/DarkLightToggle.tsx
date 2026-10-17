import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const DarkLightToggle: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;

    const storedTheme = localStorage.getItem("theme");

    if (storedTheme) {
      return storedTheme === "dark";
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;

    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const toggleTheme = (): void => {
    setDarkMode((prev) => !prev);
  };

  return (
    <button
      onClick={toggleTheme}
      className="dark:text-gray-50 font-bold"
      aria-label="Toggle Theme"
    >
      {darkMode ? <Sun size={25} /> : <Moon size={25} />}
    </button>
  );
};

export default DarkLightToggle;