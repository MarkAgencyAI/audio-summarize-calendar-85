
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { FileImage, Upload, ScanText } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { sendToWebhook } from "@/lib/webhook";

export function MathScanner() {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [mathResult, setMathResult] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [mathMethod, setMathMethod] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create a preview URL
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result as string);
        setShowDialog(true);
      };
      fileReader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error("Por favor, selecciona una imagen");
      return;
    }

    setIsUploading(true);
    setMathResult(null);
    
    try {
      // Using ImgBB API to upload the image and get a public URL
      const formData = new FormData();
      formData.append("image", selectedFile);
      
      // Upload to ImgBB
      const uploadResponse = await fetch("https://api.imgbb.com/1/upload?key=64830e69bc992ce600bf9f50588eeaa9", {
        method: "POST",
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("Error response:", errorText);
        throw new Error(`Error al subir la imagen: ${errorText}`);
      }
      
      const uploadData = await uploadResponse.json();
      
      if (!uploadData.success) {
        console.error("Upload failed:", uploadData);
        throw new Error("Error en la respuesta del servicio de alojamiento de imágenes");
      }
      
      const imageUrl = uploadData.data.url;
      console.log("Imagen subida exitosamente a:", imageUrl);
      
      const webhookData = {
        imageUrl: imageUrl,
        mathMethod: mathMethod.trim() || "No especificado"
      };
      
      // Send the URL to the webhook for math analysis
      toast.loading("Analizando expresión matemática...", { id: "analyzing-math" });
      const webhookResponse = await sendToWebhook("https://sswebhookss.maettiai.tech/webhook/a517fa5f-7575-41aa-8a03-823ad23fa55f", webhookData);
      
      toast.success("Análisis completado", { id: "analyzing-math" });
      
      // Listen for the webhook response event
      const handleWebhookMessage = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail?.type === 'webhook_analysis') {
          // Extract content or output from the response
          const content = customEvent.detail?.data?.content || customEvent.detail?.data?.output || "No se pudo analizar la expresión matemática";
          setMathResult(content);
          
          // Close the upload dialog and show the results dialog
          setShowDialog(false);
          setShowResult(true);
          
          window.removeEventListener('webhookMessage', handleWebhookMessage);
        }
      };
      
      window.addEventListener('webhookMessage', handleWebhookMessage);
      
      // Reset file selection
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Error al analizar la imagen: " + (error instanceof Error ? error.message : "Error desconocido"));
      setShowDialog(false);
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <>
      <Card className="mb-3">
        <CardContent className="p-4">
          <div className="flex flex-col items-center gap-2">
            <Button 
              variant="outline" 
              className="w-full flex items-center gap-2" 
              onClick={triggerFileInput}
            >
              <ScanText className="w-4 h-4" />
              Analizar Matemáticas
            </Button>
            <Input 
              type="file" 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange}
              ref={fileInputRef}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Escanear Expresión Matemática</DialogTitle>
            <DialogDescription>
              Confirma la imagen que contiene la expresión matemática para analizar.
            </DialogDescription>
          </DialogHeader>
          
          {previewUrl && (
            <div className="flex justify-center mb-4">
              <img 
                src={previewUrl} 
                alt="Vista previa" 
                className="max-h-[200px] rounded-md object-contain"
              />
            </div>
          )}
          
          <div className="space-y-4 mb-4">
            <div>
              <label htmlFor="mathMethod" className="text-sm font-medium">
                Método matemático utilizado (opcional)
              </label>
              <Textarea
                id="mathMethod"
                placeholder="Describe el método que estás utilizando para resolver este problema..."
                value={mathMethod}
                onChange={(e) => setMathMethod(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDialog(false);
                setSelectedFile(null);
                setPreviewUrl(null);
                setMathMethod("");
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isUploading}
            >
              {isUploading ? "Analizando..." : "Analizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resultado del Análisis</DialogTitle>
            <DialogDescription>
              Aquí está el resultado del análisis matemático.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-secondary/50 p-4 rounded-md overflow-x-auto max-h-60">
            <pre className="whitespace-pre-wrap break-words">{mathResult}</pre>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowResult(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
