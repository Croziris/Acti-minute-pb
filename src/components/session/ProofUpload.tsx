import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Check, X } from 'lucide-react';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface ProofUploadProps {
  sessionId: string;
  onUploadComplete?: (url: string) => void;
  existingProofUrl?: string;
}

export const ProofUpload: React.FC<ProofUploadProps> = ({
  sessionId,
  onUploadComplete,
  existingProofUrl
}) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingProofUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Impossible de lire le fichier"));
      reader.readAsDataURL(file);
    });

  const uploadFile = async (file: File) => {
    if (!user) return null;

    setUploading(true);
    
    try {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        throw new Error('Seuls les fichiers image sont acceptés');
      }
      
      if (file.size > 3 * 1024 * 1024) { // 3MB
        throw new Error('Le fichier ne doit pas dépasser 3 Mo');
      }

      const dataUrl = await fileToDataUrl(file);

      // Update session with proof URL
      await pb.collection('sessions').update(sessionId, { proof_media_url: dataUrl });

      setPreviewUrl(dataUrl);
      onUploadComplete?.(dataUrl);
      
      toast({
        title: "Preuve uploadée",
        description: "Votre photo de preuve a été sauvegardée avec succès.",
      });

      return dataUrl;

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Erreur d'upload",
        description: error instanceof Error ? error.message : "Erreur lors de l'upload",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await uploadFile(file);
  };

  const handleCameraCapture = async () => {
    try {
      // Check if camera access is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: "Caméra non disponible",
          description: "L'accès à la caméra n'est pas supporté sur cet appareil.",
          variant: "destructive",
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, // Prefer back camera
        audio: false 
      });

      // Create video element for camera preview
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Create canvas for capture
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;

      // Wait for video to load
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Capture frame
        context.drawImage(video, 0, 0);
        
        // Convert to blob
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `proof_${Date.now()}.jpg`, { type: 'image/jpeg' });
            await uploadFile(file);
          }
          
          // Stop camera stream
          stream.getTracks().forEach(track => track.stop());
        }, 'image/jpeg', 0.8);
      };

    } catch (error) {
      console.error('Camera error:', error);
      toast({
        title: "Erreur caméra",
        description: "Impossible d'accéder à la caméra. Utilisez l'upload de fichier.",
        variant: "destructive",
      });
    }
  };

  const removeProof = async () => {
    if (!user) return;

    try {
      await pb.collection('sessions').update(sessionId, { proof_media_url: null });

      setPreviewUrl(null);
      onUploadComplete?.(null);
      
      toast({
        title: "Preuve supprimée",
        description: "La photo de preuve a été supprimée.",
      });

    } catch (error) {
      console.error('Remove error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la preuve.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Camera className="h-5 w-5" />
          <span>Preuve de séance</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {previewUrl ? (
          <div className="space-y-3">
            <img 
              src={previewUrl} 
              alt="Preuve de séance" 
              className="w-full h-48 object-cover rounded-lg border"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-green-600">
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">Preuve enregistrée</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={removeProof}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4 mr-1" />
                Supprimer
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Ajoutez une photo pour prouver que vous avez terminé votre séance
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button 
                  onClick={handleCameraCapture}
                  disabled={uploading}
                  className="flex items-center space-x-2"
                >
                  <Camera className="h-4 w-4" />
                  <span>{uploading ? 'Upload...' : 'Prendre photo'}</span>
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>Choisir fichier</span>
                </Button>
              </div>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <p className="text-xs text-muted-foreground text-center">
              Formats acceptés: JPG, PNG (max 3 Mo)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
