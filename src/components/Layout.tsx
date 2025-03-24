
import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Mic, Calendar, Folder, User, LogOut } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-background antialiased">
      {/* Sidebar */}
      <div className="fixed h-full w-16 md:w-64 bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out shadow-sm">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-medium hidden md:block">AudioCalendar</h2>
          <span className="text-xl font-medium block md:hidden">AC</span>
        </div>
        
        <nav className="flex-1 p-2">
          <ul className="space-y-1">
            <li>
              <button 
                onClick={() => navigate("/dashboard")}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive("/dashboard") 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-secondary"
                }`}
              >
                <Mic className="h-5 w-5" />
                <span className="hidden md:inline">Grabaciones</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => navigate("/calendar")}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive("/calendar") 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-secondary"
                }`}
              >
                <Calendar className="h-5 w-5" />
                <span className="hidden md:inline">Calendario</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => navigate("/folders")}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive("/folders") 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-secondary"
                }`}
              >
                <Folder className="h-5 w-5" />
                <span className="hidden md:inline">Carpetas</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => navigate("/profile")}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive("/profile") 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-secondary"
                }`}
              >
                <User className="h-5 w-5" />
                <span className="hidden md:inline">Perfil</span>
              </button>
            </li>
          </ul>
        </nav>
        
        <div className="p-4 border-t border-border flex items-center justify-between">
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="hidden md:inline">Cerrar sesión</span>
          </button>
          <ThemeToggle />
        </div>
      </div>
      
      {/* Main content */}
      <div className="pl-16 md:pl-64 flex-1 flex flex-col transition-all duration-300">
        <main className="flex-1 p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
