
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    career: ""
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else {
      setProfile({
        name: user.name,
        email: user.email,
        career: user.career || ""
      });
    }
  }, [user, navigate]);
  
  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  
  const handleSaveProfile = () => {
    // In a real app, this would update the user's profile
    toast.success("Perfil actualizado");
  };
  
  return (
    <Layout>
      <div className="space-y-6 w-full max-w-full">
        <h1 className="text-2xl md:text-3xl font-bold text-primary dark:text-primary">
          Perfil
        </h1>
        
        <div className="glassmorphism rounded-xl p-4 md:p-6 shadow-lg dark:bg-[#001d20]/30 dark:border-[#00242880] w-full max-w-md">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input 
                  id="name" 
                  value={profile.name} 
                  onChange={e => setProfile({
                    ...profile,
                    name: e.target.value
                  })} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input 
                  id="email" 
                  value={profile.email} 
                  readOnly 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="career">Carrera</Label>
                <Input 
                  id="career" 
                  value={profile.career} 
                  onChange={e => setProfile({
                    ...profile,
                    career: e.target.value
                  })} 
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="w-full sm:w-auto"
              >
                Cerrar sesión
              </Button>
              <Button 
                onClick={handleSaveProfile} 
                className="text-slate-50 w-full sm:w-auto"
              >
                Guardar cambios
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
