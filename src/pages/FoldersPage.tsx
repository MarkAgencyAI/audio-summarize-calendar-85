
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { FolderSystem } from "@/components/FolderSystem";
import { useAuth } from "@/context/AuthContext";

export default function FoldersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);
  
  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Carpetas</h1>
        
        <div className="glassmorphism rounded-xl p-6 shadow-lg">
          <FolderSystem />
        </div>
      </div>
    </Layout>
  );
}
