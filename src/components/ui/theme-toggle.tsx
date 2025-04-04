
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
    
    // Añadir clase de transición antes de cambiar el tema para permitir transiciones suaves
    root.classList.add("theme-transition");
    
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    
    localStorage.setItem("theme", theme);

    // Añadir pequeño timeout para permitir que las transiciones se completen
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
      className="rounded-full h-10 w-10 hover:bg-accent/10 dark:hover:bg-accent/20 transition-colors"
      aria-label="Cambiar tema"
    >
      {theme === "light" ? (
        <Sun className="h-5 w-5 transition-all text-primary" />
      ) : (
        <Moon className="h-5 w-5 transition-all text-foreground" />
      )}
    </Button>
  );
}
