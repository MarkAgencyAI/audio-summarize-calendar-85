import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Image, Upload } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendToWebhook } from "@/lib/webhook";
import { useRecordings } from "@/context/RecordingsContext";

export function ImageUploader() {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [isWaitingForWebhook, setIsWaitingForWebhook] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addNote } = useRecordings();

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

  // Listen for webhook response with content
  useEffect(() => {
    const handleWebhookMessage = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.type === 'webhook_analysis' && 
          customEvent.detail?.data?.content) {
        
        // Store the content for creating a note
        const webhookData = JSON.parse(localStorage.getItem("lastWebhookData") || "{}");
        webhookData.content = customEvent.detail.data.content;
        localStorage.setItem("lastWebhookData", JSON.stringify(webhookData));
        
        // Create note directly here instead of relying on NotesSection to pick it up
        if (webhookData.description && webhookData.imageUrl && webhookData.content) {
          addNote({
            title: webhookData.description,
            content: webhookData.content,
            folderId: "default",
            imageUrl: webhookData.imageUrl
          });
          
          // Clear the data from localStorage after creating the note
          localStorage.removeItem("lastWebhookData");
          
          // Notify the user
          toast.success("Apunte creado correctamente");
        }
        
        // Indicate that we've received webhook response
        setIsWaitingForWebhook(false);
        
        // Close the dialog
        setShowDialog(false);
      }
    };
    
    window.addEventListener('webhookMessage', handleWebhookMessage);
    return () => {
      window.removeEventListener('webhookMessage', handleWebhookMessage);
    };
  }, [addNote]);

  const handleSubmit = async () => {
    if (!selectedFile || !description.trim()) {
      toast.error("Por favor, agrega una descripción de lo que estás subiendo");
      return;
    }

    setIsUploading(true);
    setIsWaitingForWebhook(true);
    
    try {
      // Using ImgBB API to upload the image and get a public URL
      const formData = new FormData();
      formData.append("image", selectedFile);
      
      // Upload to ImgBB with the new API key
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
        description: description,
        imageUrl: imageUrl
      };
      
      // Store initial data before sending to webhook
      localStorage.setItem("lastWebhookData", JSON.stringify(webhookData));
      
      // Send the URL to the webhook and notify the user we're waiting for analysis
      toast.loading("Analizando imagen...", { id: "analyzing-image" });
      await sendToWebhook("https://sswebhookss.maettiai.tech/webhook/68842cd0-b48e-4cb1-8050-43338dd79f8d", webhookData);
      
      toast.success("Imagen subida correctamente", { id: "analyzing-image" });
      
      // Dispatch a custom event that will be caught by the Dashboard component
      window.dispatchEvent(new CustomEvent('webhookResponse', {
        detail: {
          type: 'webhookResponse',
          data: webhookData
        }
      }));
      
      // Reset the form fields but do not close dialog yet
      setSelectedFile(null);
      setPreviewUrl(null);
      setDescription("");
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Error al subir la imagen: " + (error instanceof Error ? error.message : "Error desconocido"));
      setIsWaitingForWebhook(false);
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
              <Upload className="w-4 h-4" />
              Subir imagen o apuntes
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

      <Dialog open={showDialog} onOpenChange={(open) => {
        // Don't allow closing the dialog if we're still waiting for webhook
        if (!open && isWaitingForWebhook) {
          toast.info("Esperando respuesta del análisis...");
          return;
        }
        setShowDialog(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Qué estás subiendo?</DialogTitle>
            <DialogDescription>
              Describe brevemente lo que contiene esta imagen para poder organizarla mejor.
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
          
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea 
                id="description"
                placeholder="Ej: Apuntes de la clase de matemáticas del 5 de abril..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                // Only allow cancellation if not waiting for webhook
                if (!isWaitingForWebhook) {
                  setShowDialog(false);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                } else {
                  toast.info("Esperando respuesta del análisis...");
                }
              }}
              disabled={isWaitingForWebhook}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isUploading || isWaitingForWebhook}
            >
              {isUploading ? "Subiendo..." : isWaitingForWebhook ? "Analizando..." : "Subir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
