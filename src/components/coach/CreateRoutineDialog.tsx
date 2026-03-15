import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { X, Plus, GripVertical } from 'lucide-react';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Exercise {
  id: string;
  libelle: string;
  description: string | null;
}

interface RoutineExercise {
  exerciseId: string;
  exerciseName: string;
  repetitions: number | null;
  orderIndex: number;
}

interface CreateRoutineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRoutine?: any;
  onSuccess: () => void;
}

export const CreateRoutineDialog: React.FC<CreateRoutineDialogProps> = ({
  open,
  onOpenChange,
  editingRoutine,
  onSuccess
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'exercises' | 'video'>('exercises');
  const [videoUrl, setVideoUrl] = useState('');
  const [tips, setTips] = useState<string[]>(['']);
  const [selectedExercises, setSelectedExercises] = useState<RoutineExercise[]>([]);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchExercise, setSearchExercise] = useState('');

  useEffect(() => {
    if (open) {
      fetchExercises();
      if (editingRoutine) {
        loadEditingRoutine();
      } else {
        resetForm();
      }
    }
  }, [open, editingRoutine]);

  const fetchExercises = async () => {
    const data = await pb.collection('exercises').getFullList({
      sort: 'libelle',
    });
    setAvailableExercises(data as unknown as Exercise[]);
  };

  const loadEditingRoutine = async () => {
    if (!editingRoutine) return;

    setTitle(editingRoutine.title);
    setDescription(editingRoutine.description || '');
    setType(editingRoutine.type);
    setVideoUrl(editingRoutine.video_url || '');
    setTips(editingRoutine.tips?.length > 0 ? editingRoutine.tips : ['']);

    if (editingRoutine.type === 'exercises') {
      const exercisesData = await pb.collection('routine_exercises').getFullList({
        filter: `routine_id="${editingRoutine.id}"`,
        sort: 'order_index',
        expand: 'exercise_id',
      });

      if (exercisesData) {
        setSelectedExercises(
          exercisesData.map((ex: any) => ({
            exerciseId: ex.exercise_id,
            exerciseName: ex.expand?.exercise_id?.libelle || '',
            repetitions: ex.repetitions,
            orderIndex: ex.order_index
          }))
        );
      }
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('exercises');
    setVideoUrl('');
    setTips(['']);
    setSelectedExercises([]);
  };

  const addExercise = (exerciseId: string) => {
    const exercise = availableExercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    setSelectedExercises([
      ...selectedExercises,
      {
        exerciseId: exercise.id,
        exerciseName: exercise.libelle,
        repetitions: null,
        orderIndex: selectedExercises.length
      }
    ]);
  };

  const removeExercise = (index: number) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  };

  const updateExerciseReps = (index: number, reps: number | null) => {
    const updated = [...selectedExercises];
    updated[index].repetitions = reps;
    setSelectedExercises(updated);
  };

  const addTip = () => {
    setTips([...tips, '']);
  };

  const updateTip = (index: number, value: string) => {
    const updated = [...tips];
    updated[index] = value;
    setTips(updated);
  };

  const removeTip = (index: number) => {
    setTips(tips.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!user || !title.trim()) {
      toast.error('Le titre est requis');
      return;
    }

    if (type === 'video' && !videoUrl.trim()) {
      toast.error('L\'URL de la vidéo est requise');
      return;
    }

    if (type === 'exercises' && selectedExercises.length === 0) {
      toast.error('Ajoutez au moins un exercice');
      return;
    }

    try {
      setLoading(true);

      const filteredTips = tips.filter(tip => tip.trim() !== '');

      const routineData = {
        coach_id: user.id,
        title,
        description: description || null,
        type,
        video_url: type === 'video' ? videoUrl : null,
        tips: filteredTips
      };

      let routineId: string;

      if (editingRoutine) {
        // Update existing routine
        await pb.collection('routines').update(editingRoutine.id, routineData);
        routineId = editingRoutine.id;

        // Delete existing exercises
        const existingExercises = await pb.collection('routine_exercises').getFullList({
          filter: `routine_id="${routineId}"`,
        });
        await Promise.all(existingExercises.map((item: any) => pb.collection('routine_exercises').delete(item.id)));
      } else {
        // Create new routine
        const data = await pb.collection('routines').create(routineData);
        routineId = data.id;
      }

      // Insert exercises if type is exercises
      if (type === 'exercises' && selectedExercises.length > 0) {
        const exercisesToInsert = selectedExercises.map((ex, idx) => ({
          routine_id: routineId,
          exercise_id: ex.exerciseId,
          order_index: idx,
          repetitions: ex.repetitions
        }));

        await Promise.all(
          exercisesToInsert.map((exercise) => pb.collection('routine_exercises').create(exercise))
        );
      }

      toast.success(editingRoutine ? 'Routine mise à jour' : 'Routine créée avec succès');
      onSuccess();
    } catch (err: any) {
      console.error('Error saving routine:', err);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = availableExercises.filter(ex =>
    ex.libelle.toLowerCase().includes(searchExercise.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {editingRoutine ? 'Modifier la routine' : 'Créer une routine'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)]">
          <div className="space-y-6 pr-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Détente cervicale"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez l'objectif de cette routine..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Type de routine *</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exercises">Exercices</SelectItem>
                  <SelectItem value="video">Vidéo YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {type === 'video' && (
              <div className="space-y-2">
                <Label htmlFor="videoUrl">URL de la vidéo YouTube *</Label>
                <Input
                  id="videoUrl"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
            )}

            {type === 'exercises' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Ajouter des exercices</Label>
                  <Input
                    placeholder="Rechercher un exercice..."
                    value={searchExercise}
                    onChange={(e) => setSearchExercise(e.target.value)}
                  />
                  <ScrollArea className="h-40 border rounded-md p-2">
                    {filteredExercises.map(exercise => (
                      <Button
                        key={exercise.id}
                        variant="ghost"
                        className="w-full justify-start mb-1"
                        onClick={() => addExercise(exercise.id)}
                        disabled={selectedExercises.some(ex => ex.exerciseId === exercise.id)}
                      >
                        {exercise.libelle}
                      </Button>
                    ))}
                  </ScrollArea>
                </div>

                <div className="space-y-2">
                  <Label>Exercices sélectionnés ({selectedExercises.length})</Label>
                  {selectedExercises.map((ex, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline">{idx + 1}</Badge>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{ex.exerciseName}</p>
                        </div>
                        <Input
                          type="number"
                          placeholder="Reps"
                          value={ex.repetitions || ''}
                          onChange={(e) => updateExerciseReps(idx, e.target.value ? parseInt(e.target.value) : null)}
                          className="w-20"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExercise(idx)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Conseils (Tips)</Label>
                <Button variant="outline" size="sm" onClick={addTip}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>
              {tips.map((tip, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    value={tip}
                    onChange={(e) => updateTip(idx, e.target.value)}
                    placeholder="Conseil..."
                  />
                  {tips.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTip(idx)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Enregistrement...' : editingRoutine ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
