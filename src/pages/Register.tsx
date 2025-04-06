
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Authentication } from "@/components/Authentication";
import { useAuth } from "@/context/AuthContext";

export default function Register() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to dashboard if already logged in
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-primary/20 dark:from-background dark:to-primary/10">
      <div className="mb-8">
        <img 
          src="/lovable-uploads/e871068b-d83e-4ef9-ad4d-aada735de0e2.png" 
          alt="Cali Logo" 
          className="h-24 w-auto"
        />
      </div>
      <Authentication type="register" />
    </div>
  );
}
