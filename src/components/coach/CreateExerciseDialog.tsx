import React, { useState } from 'react';
import { pb } from '@/lib/pocketbase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { extractYouTubeVideoId } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateExerciseDialog: React.FC<Props> = ({ open, onOpenChange, onSuccess }) => {
  const [libelle, setLibelle] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [niveau, setNiveau] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setLibelle('');
    setDescription('');
    setYoutubeUrl('');
    setNiveau('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!libelle.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom de l\'exercice est requis',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        libelle: libelle.trim(),
        description: description.trim(),
        youtube_url: youtubeUrl.trim(),
        video_id: extractYouTubeVideoId(youtubeUrl.trim()) || '',
        video_provider: youtubeUrl.trim() ?'youtube' : '',
        niveau: niveau.trim(),
        categories: [],
        groupes: [],
        materiel: [],
        verified: false,
      };

      await pb.collection('exercises').create(payload);

      toast({
        title: 'Exercice ajouté',
        description: 'L\'exercice a été créé avec succès',
      });

      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating exercise:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer l\'exercice',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enregistrer un nouvel exercice</DialogTitle>
          <DialogDescription>
            Créez un exercice personnalisé pour votre bibliothèque
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="libelle">Nom de l'exercice *</Label>
            <Input
              id="libelle"
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
              placeholder="Ex: Pompes"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez l'exercice..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="youtube">URL YouTube</Label>
            <Input
              id="youtube"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              type="url"
            />
          </div>

          <div>
            <Label htmlFor="niveau">Niveau</Label>
            <Input
              id="niveau"
              value={niveau}
              onChange={(e) => setNiveau(e.target.value)}
              placeholder="Ex: débutant, intermédiaire, avancé"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ?'Création...' : 'Créer l\'exercice'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

