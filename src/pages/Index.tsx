
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    // Wait for auth to initialize
    if (!isLoading) {
      // Redirect to dashboard if logged in, otherwise to login
      if (user) {
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    }
  }, [user, isLoading, navigate]);
  
  // Show a loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center animate-pulse">
        <h1 className="text-3xl font-bold mb-4">AudioCalendar</h1>
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    </div>
  );
}
