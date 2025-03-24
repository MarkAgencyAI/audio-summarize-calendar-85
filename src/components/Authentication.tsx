
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface AuthenticationProps {
  type: "login" | "register";
}

export function Authentication({ type }: AuthenticationProps) {
  const navigate = useNavigate();
  const { login, register, isLoading } = useAuth();
  
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    career: ""
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
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!form.name || !form.email || !form.password || !form.career) {
        toast.error("Por favor, completa todos los campos");
        return;
      }
      
      if (form.password !== form.confirmPassword) {
        toast.error("Las contraseñas no coinciden");
        return;
      }
      
      await register(form.name, form.email, form.password, form.career);
      navigate("/dashboard");
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al registrarse");
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/20">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md glassmorphism rounded-xl shadow-lg overflow-hidden animate-scale-in">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">AudioCalendar</h1>
            <p className="text-muted-foreground">
              {type === "login" 
                ? "Inicia sesión en tu cuenta" 
                : "Crea una nueva cuenta"}
            </p>
          </div>
          
          <form onSubmit={type === "login" ? handleLogin : handleRegister}>
            {type === "register" && (
              <div className="space-y-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    placeholder="Tu nombre"
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => updateForm("password", e.target.value)}
                  required
                />
              </div>
              
              {type === "register" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={form.confirmPassword}
                      onChange={(e) => updateForm("confirmPassword", e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="career">Carrera</Label>
                    <Input
                      id="career"
                      placeholder="Ingeniería, Medicina, etc."
                      value={form.career}
                      onChange={(e) => updateForm("career", e.target.value)}
                      required
                    />
                  </div>
                </>
              )}
            </div>
            
            <Button 
              className="w-full" 
              type="submit"
              disabled={isLoading}
            >
              {isLoading 
                ? "Cargando..." 
                : type === "login" ? "Iniciar sesión" : "Registrarse"}
            </Button>
            
            <div className="mt-4 text-center text-sm">
              {type === "login" ? (
                <p>
                  ¿No tienes una cuenta?{" "}
                  <Button 
                    variant="link" 
                    className="p-0" 
                    onClick={() => navigate("/register")}
                  >
                    Regístrate
                  </Button>
                </p>
              ) : (
                <p>
                  ¿Ya tienes una cuenta?{" "}
                  <Button 
                    variant="link" 
                    className="p-0" 
                    onClick={() => navigate("/login")}
                  >
                    Inicia sesión
                  </Button>
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
