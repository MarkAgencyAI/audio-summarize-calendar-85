
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Authentication } from "@/components/Authentication";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to dashboard if already logged in
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);
  
  return <Authentication type="login" />;
}
