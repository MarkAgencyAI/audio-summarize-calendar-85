
import { ReactNode, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Mic, Calendar, Folder, User, LogOut, Menu, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const isActive = (path: string) => location.pathname === path;
  
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-background antialiased">
      {/* Mobile menu button */}
      {isMobile && (
        <button 
          onClick={toggleSidebar}
          className="fixed z-50 top-4 left-4 p-2 rounded-lg bg-primary text-primary-foreground shadow-md"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}
      
      {/* Sidebar */}
      <div className={`fixed h-full z-40 bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out shadow-sm ${
        isMobile 
          ? sidebarOpen 
            ? "left-0 w-64" 
            : "-left-64 w-64" 
          : "left-0 w-16 md:w-64"
      }`}>
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-medium hidden md:block">AudioCalendar</h2>
          <span className="text-xl font-medium block md:hidden">AC</span>
        </div>
        
        <nav className="flex-1 p-2">
          <ul className="space-y-1">
            <li>
              <button 
                onClick={() => {
                  navigate("/dashboard");
                  isMobile && setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive("/dashboard") 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-secondary"
                }`}
              >
                <Mic className="h-5 w-5" />
                <span className={`${isMobile ? "inline" : "hidden md:inline"}`}>Grabaciones</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => {
                  navigate("/calendar");
                  isMobile && setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive("/calendar") 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-secondary"
                }`}
              >
                <Calendar className="h-5 w-5" />
                <span className={`${isMobile ? "inline" : "hidden md:inline"}`}>Calendario</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => {
                  navigate("/folders");
                  isMobile && setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive("/folders") 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-secondary"
                }`}
              >
                <Folder className="h-5 w-5" />
                <span className={`${isMobile ? "inline" : "hidden md:inline"}`}>Carpetas</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => {
                  navigate("/profile");
                  isMobile && setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive("/profile") 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-secondary"
                }`}
              >
                <User className="h-5 w-5" />
                <span className={`${isMobile ? "inline" : "hidden md:inline"}`}>Perfil</span>
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
            <span className={`${isMobile ? "inline" : "hidden md:inline"}`}>Cerrar sesión</span>
          </button>
          <ThemeToggle />
        </div>
      </div>
      
      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isMobile 
          ? "pl-0"
          : "pl-16 md:pl-64"
      }`}>
        {/* Mobile overlay */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-30"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
        
        <main className={`flex-1 p-4 md:p-6 animate-fade-in ${isMobile ? "pt-16" : ""}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
