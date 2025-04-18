
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth, UserRole } from "@/context/AuthContext";
import { toast } from "sonner";

export function RegisterForm({ isLoading }: { isLoading: boolean }) {
  const navigate = useNavigate();
  const { register } = useAuth();
  
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
    <form onSubmit={handleRegister}>
      <div className="space-y-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-foreground dark:text-foreground">Nombre</Label>
          <Input
            id="name"
            placeholder="Tu nombre"
            value={form.name}
            onChange={(e) => updateForm("name", e.target.value)}
            required
            className="border-input dark:border-input focus:border-primary dark:focus:border-primary focus:ring-primary dark:focus:ring-primary"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-foreground dark:text-foreground">Tipo de usuario</Label>
          <RadioGroup 
            value={role} 
            onValueChange={(value) => setRole(value as UserRole)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="student" id="student" />
              <Label htmlFor="student" className="cursor-pointer text-foreground dark:text-foreground">Estudiante</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="teacher" id="teacher" />
              <Label htmlFor="teacher" className="cursor-pointer text-foreground dark:text-foreground">Profesor</Label>
            </div>
          </RadioGroup>
        </div>
        
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
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-foreground dark:text-foreground">Confirmar contraseña</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={form.confirmPassword}
            onChange={(e) => updateForm("confirmPassword", e.target.value)}
            required
            className="border-input dark:border-input focus:border-primary dark:focus:border-primary focus:ring-primary dark:focus:ring-primary"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="career" className="text-foreground dark:text-foreground">Carrera</Label>
          <Input
            id="career"
            placeholder="Ingeniería, Medicina, etc."
            value={form.career}
            onChange={(e) => updateForm("career", e.target.value)}
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
        {isLoading ? "Cargando..." : "Registrarse"}
      </Button>
      
      <div className="mt-4 text-center text-sm">
        <p className="text-foreground dark:text-foreground">
          ¿Ya tienes una cuenta?{" "}
          <Button 
            variant="link" 
            className="p-0 text-primary dark:text-primary" 
            onClick={() => navigate("/login")}
          >
            Inicia sesión
          </Button>
        </p>
      </div>
    </form>
  );
}
