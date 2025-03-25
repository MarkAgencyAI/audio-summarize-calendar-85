
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { FolderSystem } from "@/components/FolderSystem";
import { useAuth } from "@/context/AuthContext";
import { PdfUploader } from "@/components/PdfUploader";

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
      <div className="space-y-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold">Carpetas</h1>
        
        {/* Only show PdfUploader to teachers */}
        {user?.role === "teacher" && (
          <div className="glassmorphism rounded-xl p-4 md:p-6 shadow-lg">
            <PdfUploader />
          </div>
        )}
        
        <div className="glassmorphism rounded-xl p-4 md:p-6 shadow-lg">
          <FolderSystem />
        </div>
      </div>
    </Layout>
  );
}
