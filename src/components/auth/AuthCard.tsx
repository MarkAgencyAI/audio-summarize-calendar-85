
import { ReactNode } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="w-full">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full glassmorphism rounded-xl shadow-lg overflow-hidden animate-scale-in">
        <div className="p-6 sm:p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-primary dark:text-primary">Cali</h1>
            <p className="text-foreground dark:text-foreground">{subtitle}</p>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
}
