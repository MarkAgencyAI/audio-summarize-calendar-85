
import { ReactNode, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Mic, Calendar, Folder, User, LogOut, Menu, X, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const isActive = (path: string) => location.pathname === path;
  
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Use different icon for dashboard based on user role
  const getDashboardIcon = () => {
    return user?.role === "teacher" ? <FileText className="h-5 w-5" /> : <Mic className="h-5 w-5" />;
  };

  // Use different label for dashboard based on user role
  const getDashboardLabel = () => {
    return user?.role === "teacher" ? "Transcripciones" : "Grabaciones";
  };

  const navItems = [
    { path: "/dashboard", icon: getDashboardIcon(), label: getDashboardLabel() },
    { path: "/calendar", icon: <Calendar className="h-5 w-5" />, label: "Calendario" },
    { path: "/folders", icon: <Folder className="h-5 w-5" />, label: "Carpetas" },
    { path: "/profile", icon: <User className="h-5 w-5" />, label: "Perfil" },
  ];

  return (
    <div className="flex min-h-screen bg-background antialiased">
      {/* Sidebar for desktop */}
      {!isMobile && (
        <div className={`fixed h-full z-40 bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out shadow-sm ${
          sidebarOpen ? 'left-0 w-16 md:w-64' : 'left-[-64px] md:left-[-256px] w-16 md:w-64'
        }`}>
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className={`text-xl font-bold italic ${sidebarOpen ? 'hidden md:block' : 'hidden'}`}>
              Cali
            </h2>
            <span className={`text-xl font-bold italic ${sidebarOpen ? 'block md:hidden' : 'hidden'}`}>
              C
            </span>
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
                    <span className={`${sidebarOpen ? 'hidden md:inline' : 'hidden'}`}>{item.label}</span>
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
              <span className={`${sidebarOpen ? 'hidden md:inline' : 'hidden'}`}>Cerrar sesión</span>
            </button>
            <ThemeToggle />
          </div>
        </div>
      )}
      
      {/* Toggle button for sidebar */}
      {!isMobile && (
        <button 
          onClick={toggleSidebar}
          className={`fixed z-50 top-4 ${sidebarOpen ? 'left-[260px] md:left-[252px]' : 'left-4'} bg-card rounded-full h-8 w-8 flex items-center justify-center shadow-md border border-border transition-all duration-300`}
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      )}
      
      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isMobile 
          ? "pb-16" // Add bottom padding for mobile to accommodate the navbar
          : sidebarOpen ? "pl-16 md:pl-64" : "pl-0"
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
