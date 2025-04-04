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
  const {
    user,
    logout
  } = useAuth();
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
  return <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-custom-primary dark:text-custom-accent dark:text-white">Perfil</h1>
        
        <div className="glassmorphism rounded-xl p-6 shadow-lg max-w-md">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" value={profile.name} onChange={e => setProfile({
                ...profile,
                name: e.target.value
              })} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" value={profile.email} readOnly />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="career">Carrera</Label>
                <Input id="career" value={profile.career} onChange={e => setProfile({
                ...profile,
                career: e.target.value
              })} />
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleLogout}>
                Cerrar sesión
              </Button>
              <Button onClick={handleSaveProfile}>
                Guardar cambios
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>;
}