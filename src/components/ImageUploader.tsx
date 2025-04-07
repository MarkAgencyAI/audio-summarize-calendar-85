
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Image, Upload } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendToWebhook } from "@/lib/webhook";

export function ImageUploader() {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [showDialog, setShowDialog] = useState(false);
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
    if (!selectedFile || !description.trim()) {
      toast.error("Por favor, agrega una descripción de lo que estás subiendo");
      return;
    }

    setIsUploading(true);
    try {
      // Create a FormData object to handle the file
      const formData = new FormData();
      formData.append("file", selectedFile);
      
      // Upload the file to get a URL
      const uploadResponse = await fetch("https://api.imgbb.com/1/upload?key=a0452f73aee56b28ee63adb1bf2c8497", {
        method: "POST",
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error("Error al subir la imagen");
      }
      
      const uploadData = await uploadResponse.json();
      const imageUrl = uploadData.data.url;
      
      // Send the data to the webhook
      await sendToWebhook("https://sswebhookss.maettiai.tech/webhook/68842cd0-b48e-4cb1-8050-43338dd79f8d", {
        description: description,
        imageUrl: imageUrl
      });
      
      toast.success("Imagen subida correctamente");
      
      // Reset the form
      setSelectedFile(null);
      setPreviewUrl(null);
      setDescription("");
      setShowDialog(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Error al subir la imagen");
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
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
                setShowDialog(false);
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isUploading}
            >
              {isUploading ? "Subiendo..." : "Subir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
