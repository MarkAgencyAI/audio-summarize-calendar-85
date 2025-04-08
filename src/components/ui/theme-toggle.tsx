
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      return storedTheme || (prefersDark ? "dark" : "light");
    }
    return "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Add transition class before changing theme to allow smooth transitions
    root.classList.add("theme-transition");
    
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    
    localStorage.setItem("theme", theme);

    // Add small timeout to allow transitions to complete
    const timer = setTimeout(() => {
      root.classList.remove("theme-transition");
    }, 300);

    return () => clearTimeout(timer);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme}
      className="rounded-full h-8 w-8 hover:bg-[#2a2a2a10] dark:hover:bg-[#2a2a2a40] transition-colors"
      aria-label="Cambiar tema"
    >
      {theme === "light" ? (
        <Sun className="h-4 w-4 transition-all text-[#00b8ae]" />
      ) : (
        <Moon className="h-4 w-4 transition-all text-[#00b8ae]" />
      )}
    </Button>
  );
}
