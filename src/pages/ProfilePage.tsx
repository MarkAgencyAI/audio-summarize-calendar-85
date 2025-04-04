
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
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-custom-primary dark:text-custom-accent">Perfil</h1>
        
        <div className="glassmorphism rounded-xl p-6 shadow-lg max-w-md dark:bg-custom-secondary/20 dark:border-custom-secondary/40">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="dark:text-white">Nombre</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="dark:bg-custom-secondary/30 dark:border-custom-secondary/60 dark:text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="dark:text-white">Correo electrónico</Label>
                <Input
                  id="email"
                  value={profile.email}
                  readOnly
                  className="dark:bg-custom-secondary/30 dark:border-custom-secondary/60 dark:text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="career" className="dark:text-white">Carrera</Label>
                <Input
                  id="career"
                  value={profile.career}
                  onChange={(e) => setProfile({ ...profile, career: e.target.value })}
                  className="dark:bg-custom-secondary/30 dark:border-custom-secondary/60 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleLogout} className="dark:bg-custom-secondary/30 dark:border-custom-secondary/60 dark:text-white">
                Cerrar sesión
              </Button>
              <Button onClick={handleSaveProfile} className="dark:bg-custom-accent dark:hover:bg-custom-accent/90">
                Guardar cambios
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
