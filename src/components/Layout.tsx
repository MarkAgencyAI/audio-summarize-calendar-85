import { ReactNode, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Mic, Calendar, Folder, User, LogOut, Menu, X, ChevronLeft, ChevronRight, FileText } from "lucide-react";
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
  const {
    user,
    logout
  } = useAuth();
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
    return user?.role === "teacher" ? <FileText className="h-5 w-5" /> : <Mic className="h-5 w-5" />;
  };
  const getDashboardLabel = () => {
    return user?.role === "teacher" ? "Transcripciones" : "Grabaciones";
  };
  const navItems = [{
    path: "/dashboard",
    icon: getDashboardIcon(),
    label: getDashboardLabel()
  }, {
    path: "/calendar",
    icon: <Calendar className="h-5 w-5" />,
    label: "Calendario"
  }, {
    path: "/folders",
    icon: <Folder className="h-5 w-5" />,
    label: "Carpetas"
  }, {
    path: "/profile",
    icon: <User className="h-5 w-5" />,
    label: "Perfil"
  }];
  return <div className="flex min-h-screen bg-background text-foreground antialiased">
      {/* Mobile Top Navbar */}
      {isMobile && <div className="fixed top-0 left-0 right-0 z-50 bg-card dark:bg-card border-b border-border dark:border-border h-14 flex items-center justify-between px-4">
          <div onClick={() => navigate("/dashboard")} className="cursor-pointer flex items-center justify-center h-full">
            <img src="/lovable-uploads/e871068b-d83e-4ef9-ad4d-aada735de0e2.png" alt="Cali Logo" className="max-h-24 max-w-24 object-contain" />
          </div>
          <ThemeToggle />
        </div>}
      
      {/* Desktop Sidebar */}
      {!isMobile && <div className={`fixed h-full z-40 bg-sidebar-background dark:bg-sidebar-background border-r border-sidebar-border dark:border-sidebar-border flex flex-col transition-all duration-300 ease-in-out shadow-sm ${sidebarOpen ? 'left-0 w-16 md:w-64' : 'left-[-64px] md:left-[-256px] w-16 md:w-64'}`}>
          <div className=" border-b border-sidebar-border dark:border-sidebar-border flex items-center justify-between">
            <div className={`${sidebarOpen ? 'hidden md:block' : 'hidden'} flex items-center justify-center`}>
              <img src="/lovable-uploads/e871068b-d83e-4ef9-ad4d-aada735de0e2.png" alt="Cali Logo" className="max-h-24 max-w-24 object-contain" />
            </div>
            <div className={`${sidebarOpen ? 'block md:hidden' : 'hidden'} flex items-center justify-center`}>
              <img src="/lovable-uploads/e871068b-d83e-4ef9-ad4d-aada735de0e2.png" alt="Cali Logo" className="max-h-8 max-w-8 object-contain" />
            </div>
          </div>
          
          <nav className="flex-1 p-2">
            <ul className="space-y-1">
              {navItems.map(item => <li key={item.path}>
                  <button onClick={() => navigate(item.path)} className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${isActive(item.path) ? "bg-[#008C85] text-white dark:bg-[#008C85] dark:text-white" : "hover:bg-sidebar-accent/50 dark:hover:bg-sidebar-accent/50 text-sidebar-foreground dark:text-sidebar-foreground"}`}>
                    {item.icon}
                    <span className={`${sidebarOpen ? 'hidden md:inline' : 'hidden'}`}>{item.label}</span>
                  </button>
                </li>)}
            </ul>
          </nav>
          
          <div className="p-4 border-t border-sidebar-border dark:border-sidebar-border flex items-center justify-between">
            <button onClick={handleLogout} className="flex items-center space-x-2 text-sidebar-foreground dark:text-sidebar-foreground hover:text-sidebar-primary dark:hover:text-sidebar-primary transition-colors">
              <LogOut className="h-5 w-5" />
              <span className={`${sidebarOpen ? 'hidden md:inline' : 'hidden'}`}>Cerrar sesión</span>
            </button>
            <ThemeToggle />
          </div>
        </div>}
      
      {/* Sidebar Toggle Button */}
      {!isMobile && <button onClick={toggleSidebar} className={`fixed z-50 top-4 ${sidebarOpen ? 'left-[260px] md:left-[252px]' : 'left-4'} bg-card dark:bg-card rounded-full h-8 w-8 flex items-center justify-center shadow-md border border-border dark:border-border transition-all duration-300 text-foreground dark:text-foreground`}>
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>}
      
      {/* Mobile Navigation */}
      {isMobile && <div className="fixed bottom-0 left-0 right-0 bg-card dark:bg-card border-t border-border dark:border-border z-40 h-16">
          <div className="grid grid-cols-4 h-full">
            {navItems.map(item => <button key={item.path} onClick={() => navigate(item.path)} className={`flex flex-col items-center justify-center h-full px-1 ${isActive(item.path) ? "bg-[#008C85] text-white dark:bg-[#008C85] dark:text-white" : "text-muted-foreground dark:text-muted-foreground"}`}>
                {item.icon}
                <span className="text-xs mt-1">{item.label}</span>
              </button>)}
          </div>
        </div>}
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isMobile ? "pt-14 pb-16" /* Add top padding for mobile navbar */ : sidebarOpen ? "pl-16 md:pl-64" : "pl-0"}`}>
        <main className="flex-1 p-3 md:p-6 animate-fade-in overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>;
}