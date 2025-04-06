
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export function LoginForm({ isLoading }: { isLoading: boolean }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  
  const updateForm = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!form.email || !form.password) {
        toast.error("Por favor, completa todos los campos");
        return;
      }
      
      await login(form.email, form.password);
      navigate("/dashboard");
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al iniciar sesión");
    }
  };
  
  return (
    <form onSubmit={handleLogin}>
      <div className="space-y-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground dark:text-foreground">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            placeholder="correo@ejemplo.com"
            value={form.email}
            onChange={(e) => updateForm("email", e.target.value)}
            required
            className="border-input dark:border-input focus:border-primary dark:focus:border-primary focus:ring-primary dark:focus:ring-primary"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password" className="text-foreground dark:text-foreground">Contraseña</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => updateForm("password", e.target.value)}
            required
            className="border-input dark:border-input focus:border-primary dark:focus:border-primary focus:ring-primary dark:focus:ring-primary"
          />
        </div>
      </div>
      
      <Button 
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? "Cargando..." : "Iniciar sesión"}
      </Button>
      
      <div className="mt-4 text-center text-sm">
        <p className="text-foreground dark:text-foreground">
          ¿No tienes una cuenta?{" "}
          <Button 
            variant="link" 
            className="p-0 text-primary dark:text-primary" 
            onClick={() => navigate("/register")}
          >
            Regístrate
          </Button>
        </p>
      </div>
    </form>
  );
}
