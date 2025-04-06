
import { useAuth } from "@/context/AuthContext";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";

interface AuthenticationProps {
  type: "login" | "register";
}

export function Authentication({ type }: AuthenticationProps) {
  const { isLoading } = useAuth();
  
  const getSubtitle = () => {
    return type === "login" 
      ? "Inicia sesión en tu cuenta" 
      : "Crea una nueva cuenta";
  };
  
  return (
    <AuthCard title="Cali" subtitle={getSubtitle()}>
      {type === "login" 
        ? <LoginForm isLoading={isLoading} /> 
        : <RegisterForm isLoading={isLoading} />
      }
    </AuthCard>
  );
}
