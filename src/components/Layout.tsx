
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

  const navItems = [
    { path: "/dashboard", icon: <Mic className="h-5 w-5" />, label: "Grabaciones" },
    { path: "/calendar", icon: <Calendar className="h-5 w-5" />, label: "Calendario" },
    { path: "/folders", icon: <Folder className="h-5 w-5" />, label: "Carpetas" },
    { path: "/profile", icon: <User className="h-5 w-5" />, label: "Perfil" },
  ];

  return (
    <div className="flex min-h-screen bg-background antialiased">
      {/* Sidebar for desktop */}
      {!isMobile && (
        <div className="fixed h-full z-40 bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out shadow-sm left-0 w-16 md:w-64">
          <div className="p-4 border-b border-border">
            <h2 className="text-xl font-medium hidden md:block">AudioCalendar</h2>
            <span className="text-xl font-medium block md:hidden">AC</span>
          </div>
          
          <nav className="flex-1 p-2">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.path}>
                  <button 
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isActive(item.path) 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-secondary"
                    }`}
                  >
                    {item.icon}
                    <span className="hidden md:inline">{item.label}</span>
                  </button>
                </li>
              ))}
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
      )}
      
      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isMobile 
          ? "pb-16" // Add bottom padding for mobile to accommodate the navbar
          : "pl-16 md:pl-64"
      }`}>
        <main className="flex-1 p-4 md:p-6 animate-fade-in">
          {children}
        </main>
        
        {/* Bottom navigation for mobile */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 h-16">
            <div className="grid grid-cols-4 h-full">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center justify-center h-full px-1 ${
                    isActive(item.path)
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {item.icon}
                  <span className="text-xs mt-1">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
