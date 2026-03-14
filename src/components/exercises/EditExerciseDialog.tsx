import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { pb } from '@/lib/pocketbase';
import { toast } from '@/hooks/use-toast';
import { extractYouTubeVideoId } from '@/lib/utils';

interface Exercise {
  id: string;
  libelle: string;
  description?: string;
  categories: string[];
  groupes: string[];
  niveau?: string;
  materiel: string[];
  youtube_url?: string;
  video_id?: string;
  video_provider: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise: Exercise;
  onSuccess: () => void;
}

const CATEGORIES = [
  'Cardio', 'Musculation', 'Étirements', 'Mobilité', 'HIIT', 
  'Yoga', 'Pilates', 'Fonctionnel', 'Isométrique'
];

const GROUPES = [
  'Pectoraux', 'Dos', 'Épaules', 'Biceps', 'Triceps', 'Abdos',
  'Quadriceps', 'Ischio-jambiers', 'Mollets', 'Fessiers', 'Corps entier'
];

const NIVEAUX = ['Débutant', 'Intermédiaire', 'Avancé'];

const MATERIEL = [
  'Aucun', 'Haltères', 'Barre', 'Élastiques', 'Kettlebell', 
  'Medecine ball', 'Banc', 'Pull-up bar', 'TRX'
];

export const EditExerciseDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  exercise,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    libelle: exercise.libelle,
    description: exercise.description || '',
    youtube_url: exercise.youtube_url || '',
    categories: exercise.categories,
    groupes: exercise.groupes,
    niveau: exercise.niveau || '',
    materiel: exercise.materiel
  });
  const [saving, setSaving] = useState(false);

  const toggleArrayItem = (array: string[], item: string, setter: (arr: string[]) => void) => {
    if (array.includes(item)) {
      setter(array.filter(i => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  const handleSave = async () => {
    if (!formData.libelle) return;

    try {
      setSaving(true);

      await pb.collection('exercises').update(exercise.id, {
        libelle: formData.libelle,
        description: formData.description,
        youtube_url: formData.youtube_url,
        video_id: extractYouTubeVideoId(formData.youtube_url),
        categories: formData.categories,
        groupes: formData.groupes,
        niveau: formData.niveau,
        materiel: formData.materiel,
      });

      toast({
        title: "Exercice modifié",
        description: "Les modifications ont été enregistrées",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier l'exercice",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'exercice</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="libelle">Nom de l'exercice *</Label>
            <Input
              id="libelle"
              value={formData.libelle}
              onChange={(e) => setFormData(prev => ({ ...prev, libelle: e.target.value }))}
              placeholder="Ex: Pompes diamant"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description détaillée de l'exercice..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="youtube_url">URL YouTube</Label>
            <Input
              id="youtube_url"
              value={formData.youtube_url}
              onChange={(e) => setFormData(prev => ({ ...prev, youtube_url: e.target.value }))}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          <div>
            <Label>Catégories</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CATEGORIES.map(cat => (
                <Badge
                  key={cat}
                  variant={formData.categories.includes(cat) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleArrayItem(
                    formData.categories, 
                    cat, 
                    (arr) => setFormData(prev => ({ ...prev, categories: arr }))
                  )}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Groupes musculaires</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {GROUPES.map(groupe => (
                <Badge
                  key={groupe}
                  variant={formData.groupes.includes(groupe) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleArrayItem(
                    formData.groupes, 
                    groupe, 
                    (arr) => setFormData(prev => ({ ...prev, groupes: arr }))
                  )}
                >
                  {groupe}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Niveau</Label>
              <Select
                value={formData.niveau}
                onValueChange={(value) => setFormData(prev => ({ ...prev, niveau: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner niveau" />
                </SelectTrigger>
                <SelectContent>
                  {NIVEAUX.map(niveau => (
                    <SelectItem key={niveau} value={niveau}>{niveau}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Matériel</Label>
              <div className="flex flex-wrap gap-1 mt-2 max-h-20 overflow-y-auto">
                {MATERIEL.map(mat => (
                  <Badge
                    key={mat}
                    variant={formData.materiel.includes(mat) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleArrayItem(
                      formData.materiel, 
                      mat, 
                      (arr) => setFormData(prev => ({ ...prev, materiel: arr }))
                    )}
                  >
                    {mat}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={!formData.libelle || saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
