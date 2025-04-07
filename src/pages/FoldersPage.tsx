
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { FolderSystem } from "@/components/FolderSystem";
import { useAuth } from "@/context/AuthContext";

export default function FoldersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Redirigir al login si no está autenticado
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);
  
  return (
    <Layout>
      <div className="space-y-4 md:space-y-8 w-full">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Materias</h1>
        
        <div className="glassmorphism rounded-xl p-3 md:p-6 shadow-lg w-full">
          <div className="w-full overflow-x-auto">
            <FolderSystem />
          </div>
        </div>
      </div>
    </Layout>
  );
}
