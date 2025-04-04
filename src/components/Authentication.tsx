
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth, UserRole } from "@/context/AuthContext";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  
  const [role, setRole] = useState<UserRole>("student");
  
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
      
      await register(form.name, form.email, form.password, form.career, role);
      navigate("/dashboard");
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al registrarse");
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-custom-background to-custom-primary/20">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md glassmorphism rounded-xl shadow-lg overflow-hidden animate-scale-in">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-custom-primary">Cali</h1>
            <p className="text-custom-text">
              {type === "login" 
                ? "Inicia sesión en tu cuenta" 
                : "Crea una nueva cuenta"}
            </p>
          </div>
          
          <form onSubmit={type === "login" ? handleLogin : handleRegister}>
            {type === "register" && (
              <div className="space-y-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-custom-text">Nombre</Label>
                  <Input
                    id="name"
                    placeholder="Tu nombre"
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    required
                    className="border-custom-primary/20 focus:border-custom-primary focus:ring-custom-primary"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-custom-text">Tipo de usuario</Label>
                  <RadioGroup 
                    value={role} 
                    onValueChange={(value) => setRole(value as UserRole)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="student" id="student" />
                      <Label htmlFor="student" className="cursor-pointer text-custom-text">Estudiante</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="teacher" id="teacher" />
                      <Label htmlFor="teacher" className="cursor-pointer text-custom-text">Profesor</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}
            
            <div className="space-y-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-custom-text">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  required
                  className="border-custom-primary/20 focus:border-custom-primary focus:ring-custom-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-custom-text">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => updateForm("password", e.target.value)}
                  required
                  className="border-custom-primary/20 focus:border-custom-primary focus:ring-custom-primary"
                />
              </div>
              
              {type === "register" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-custom-text">Confirmar contraseña</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={form.confirmPassword}
                      onChange={(e) => updateForm("confirmPassword", e.target.value)}
                      required
                      className="border-custom-primary/20 focus:border-custom-primary focus:ring-custom-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="career" className="text-custom-text">Carrera</Label>
                    <Input
                      id="career"
                      placeholder="Ingeniería, Medicina, etc."
                      value={form.career}
                      onChange={(e) => updateForm("career", e.target.value)}
                      required
                      className="border-custom-primary/20 focus:border-custom-primary focus:ring-custom-primary"
                    />
                  </div>
                </>
              )}
            </div>
            
            <Button 
              className="w-full bg-custom-primary hover:bg-custom-primary/90 text-white" 
              type="submit"
              disabled={isLoading}
            >
              {isLoading 
                ? "Cargando..." 
                : type === "login" ? "Iniciar sesión" : "Registrarse"}
            </Button>
            
            <div className="mt-4 text-center text-sm">
              {type === "login" ? (
                <p className="text-custom-text">
                  ¿No tienes una cuenta?{" "}
                  <Button 
                    variant="link" 
                    className="p-0 text-custom-primary" 
                    onClick={() => navigate("/register")}
                  >
                    Regístrate
                  </Button>
                </p>
              ) : (
                <p className="text-custom-text">
                  ¿Ya tienes una cuenta?{" "}
                  <Button 
                    variant="link" 
                    className="p-0 text-custom-primary" 
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
