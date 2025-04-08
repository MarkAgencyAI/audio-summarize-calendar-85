
import { ReactNode, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Home, Calendar, Folder, User, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({
  children
}: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const isActive = (path: string) => location.pathname === path;
  
  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const getDashboardIcon = () => {
    return <Home className="h-5 w-5" />;
  };
  
  const getDashboardLabel = () => {
    return user?.role === "teacher" ? "Transcripciones" : "Grabaciones";
  };
  
  const navItems = [
    {
      path: "/dashboard",
      icon: getDashboardIcon(),
      label: "Dashboard"
    },
    {
      path: "/calendar",
      icon: <Calendar className="h-5 w-5" />,
      label: "Calendario"
    },
    {
      path: "/folders",
      icon: <Folder className="h-5 w-5" />,
      label: "Carpetas"
    },
    {
      path: "/profile",
      icon: <User className="h-5 w-5" />,
      label: "Perfil"
    }
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground antialiased overflow-hidden">
      {/* Mobile Top Navbar */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-sidebar-background border-b border-border h-14 flex items-center justify-between px-4">
          <div onClick={() => navigate("/dashboard")} className="cursor-pointer flex items-center justify-center h-full">
            <img src="/lovable-uploads/e871068b-d83e-4ef9-ad4d-aada735de0e2.png" alt="Cali Logo" className="h-24 w-auto object-contain" />
          </div>
          <ThemeToggle />
        </div>
      )}
      
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className={`fixed h-full z-40 bg-sidebar-background border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out shadow-lg ${sidebarOpen ? 'left-0 w-16 md:w-64' : 'left-[-64px] md:left-[-256px] w-16 md:w-64'}`}>
          <div className="border-b border-sidebar-border flex items-center justify-center p-4 h-16">
            <div className={`${sidebarOpen ? 'flex' : 'hidden'} items-center justify-center`}>
              <img src="/lovable-uploads/e871068b-d83e-4ef9-ad4d-aada735de0e2.png" alt="Cali Logo" className="h-24 w-auto object-contain" />
            </div>
          </div>
          
          <nav className="flex-1 p-2 overflow-y-auto">
            <ul className="space-y-1">
              {navItems.map(item => (
                <li key={item.path}>
                  <button 
                    onClick={() => navigate(item.path)} 
                    className={`w-full flex items-center justify-start px-3 py-3 rounded-lg transition-colors ${
                      isActive(item.path) 
                        ? "bg-primary/15 text-primary" 
                        : "text-sidebar-foreground hover:text-primary hover:bg-primary/5"
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {item.icon}
                    </div>
                    <span className={`${sidebarOpen ? 'inline' : 'hidden'} font-medium ml-4 text-center`}>
                      {item.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="p-4 border-t border-sidebar-border flex items-center justify-between">
            <button 
              onClick={handleLogout} 
              className="flex items-center space-x-2 text-sidebar-foreground hover:text-primary transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className={`${sidebarOpen ? 'inline' : 'hidden'}`}>
                Cerrar sesión
              </span>
            </button>
            <ThemeToggle />
          </div>
        </div>
      )}
      
      {/* Sidebar Toggle Button */}
      {!isMobile && (
        <button 
          onClick={toggleSidebar} 
          className={`fixed z-50 top-4 bg-sidebar-background rounded-full h-8 w-8 flex items-center justify-center shadow-md border-sidebar-border border transition-all duration-300 text-primary 
            ${sidebarOpen ? 'left-[64px] md:left-[252px]' : 'left-4'}`}
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      )}
      
      {/* Mobile Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-sidebar-background border-t border-sidebar-border z-40 h-16">
          <div className="grid grid-cols-4 h-full">
            {navItems.map(item => (
              <button 
                key={item.path} 
                onClick={() => navigate(item.path)} 
                className={`flex flex-col items-center justify-center h-full px-1 ${
                  isActive(item.path) 
                    ? "bg-primary/15 text-primary" 
                    : "text-sidebar-foreground"
                }`}
              >
                {item.icon}
                <span className="text-xs mt-1 truncate w-full text-center">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isMobile ? "pt-14 pb-16" : sidebarOpen ? "pl-16 md:pl-64" : "pl-0"
      }`}>
        <main className="flex-1 p-3 md:p-6 animate-fade-in overflow-x-hidden max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
