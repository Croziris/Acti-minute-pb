import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown, Dumbbell } from 'lucide-react';
import { pb } from '@/lib/pocketbase';
import { useToast } from '@/hooks/use-toast';
import { ExerciseLibrary } from '@/components/exercises/ExerciseLibrary';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface WorkoutExercise {
  id: string;
  exercise_id: string;
  order_index: number;
  series: number | null;
  reps: number | null;
  temps_seconds: number | null;
  charge_cible: number | null;
  tempo: string | null;
  temps_repos_seconds: number | null;
  rpe_cible: number | null;
  couleur_elastique: string | null;
  circuit_number: number;
  tips: string | null;
  exercise: {
    libelle: string;
    description: string | null;
  };
}

interface Props {
  workoutId: string;
  workoutType: 'classic' | 'circuit';
  circuitRounds?: number;
  nombreCircuits?: number;
  circuitConfigs?: Array<{ rounds: number; rest: number }>;
}

export const WorkoutEditor: React.FC<Props> = ({ 
  workoutId, 
  workoutType, 
  circuitRounds, 
  nombreCircuits = 1,
  circuitConfigs = [{ rounds: 3, rest: 60 }]
}) => {
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectExerciseOpen, setSelectExerciseOpen] = useState(false);
  const [selectedCircuitForAdd, setSelectedCircuitForAdd] = useState<number>(1);
  const { toast } = useToast();

  const exercisesByCircuit = exercises.reduce((acc, exercise) => {
    const circuitNum = exercise.circuit_number || 1;
    if (!acc[circuitNum]) acc[circuitNum] = [];
    acc[circuitNum].push(exercise);
    return acc;
  }, {} as Record<number, WorkoutExercise[]>);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const records = await pb.collection('workout_exercises').getFullList({
        filter: `workout = "${workoutId}"`,
        sort: 'order_index',
        expand: 'exercise',
      });

      const normalized = records.map((record: any) => ({
        id: record.id,
        exercise_id: record.exercise,
        order_index: record.order_index ?? 0,
        series: record.series ?? null,
        reps: record.reps ?? null,
        temps_seconds: record.temps_seconds ?? null,
        charge_cible: record.charge_cible ?? null,
        tempo: record.tempo ?? null,
        temps_repos_seconds: record.temps_repos_seconds ?? null,
        rpe_cible: record.rpe_cible ?? null,
        couleur_elastique: record.couleur_elastique ?? null,
        circuit_number: record.circuit_number || 1,
        tips: record.tips ?? null,
        exercise: {
          libelle: record.expand?.exercise?.libelle || '',
          description: record.expand?.exercise?.description ?? null,
        },
      })) as WorkoutExercise[];

      setExercises(normalized);
    } catch (error: any) {
      console.error('Error fetching exercises:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les exercices",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, [workoutId]);

  const handleAddExercise = async (exercise: any) => {
    try {
      await pb.collection('workout_exercises').create({
        workout: workoutId,
        exercise: exercise.id,
        order_index: exercises.length,
        series: workoutType === 'classic' ?3 : null,
        reps: 10,
        circuit_number: selectedCircuitForAdd,
      });

      toast({
        title: "Exercice ajouté",
        description: `${exercise.libelle} a été ajouté à la séance`
      });

      setSelectExerciseOpen(false);
      fetchExercises();
    } catch (error: any) {
      console.error('Error adding exercise:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'exercice",
        variant: "destructive"
      });
    }
  };

  const openAddExerciseDialog = (circuitNumber: number = 1) => {
    setSelectedCircuitForAdd(circuitNumber);
    setSelectExerciseOpen(true);
  };

  const handleUpdateExercise = async (exerciseId: string, field: string, value: any) => {
    try {
      await pb.collection('workout_exercises').update(exerciseId, { [field]: value });

      setExercises(prev => prev.map(ex => 
        ex.id === exerciseId ?{ ...ex, [field]: value } : ex
      ));
    } catch (error: any) {
      console.error('Error updating exercise:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'exercice",
        variant: "destructive"
      });
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    try {
      await pb.collection('workout_exercises').delete(exerciseId);

      toast({
        title: "Exercice supprimé",
        description: "L'exercice a été retiré de la séance"
      });

      fetchExercises();
    } catch (error: any) {
      console.error('Error deleting exercise:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'exercice",
        variant: "destructive"
      });
    }
  };

  const handleMoveExercise = async (exerciseId: string, direction: 'up' | 'down') => {
    const currentIndex = exercises.findIndex(e => e.id === exerciseId);
    if (currentIndex === -1) return;
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === exercises.length - 1) return;

    const newIndex = direction === 'up' ?currentIndex - 1 : currentIndex + 1;
    const newExercises = [...exercises];
    [newExercises[currentIndex], newExercises[newIndex]] = [newExercises[newIndex], newExercises[currentIndex]];

    try {
      await Promise.all(
        newExercises.map((ex, idx) =>
          pb.collection('workout_exercises').update(ex.id, { order_index: idx })
        )
      );

      setExercises(newExercises);
    } catch (error: any) {
      console.error('Error moving exercise:', error);
      toast({
        title: "Erreur",
        description: "Impossible de déplacer l'exercice",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {workoutType === 'circuit' && nombreCircuits > 1 ?(
        // Affichage par circuit
        <div className="space-y-6">
          {Array.from({ length: nombreCircuits }, (_, i) => i + 1).map((circuitNum) => {
            const circuitExercises = exercisesByCircuit[circuitNum] || [];
            const config = circuitConfigs[circuitNum - 1] || { rounds: 3, rest: 60 };

            return (
              <Card key={circuitNum}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Circuit {circuitNum}
                        <Badge variant="outline">
                          {config.rounds} tour{config.rounds > 1 ?'s' : ''}
                        </Badge>
                        <Badge variant="secondary">
                          {config.rest}s repos
                        </Badge>
                      </CardTitle>
                    </div>
                    <Button
                      onClick={() => openAddExerciseDialog(circuitNum)}
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter exercice
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {circuitExercises.length === 0 ?(
                    <p className="text-muted-foreground text-center py-8">
                      Aucun exercice dans ce circuit
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {circuitExercises.map((exercise, index) => (
                        <ExerciseItem
                          key={exercise.id}
                          exercise={exercise}
                          index={index}
                          onUpdate={handleUpdateExercise}
                          onDelete={handleDeleteExercise}
                          onMove={handleMoveExercise}
                          workoutType={workoutType}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        // Affichage simple
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Exercices</CardTitle>
              <Button
                onClick={() => openAddExerciseDialog(1)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Ajouter exercice
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {exercises.length === 0 ?(
              <div className="text-center py-12">
                <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Aucun exercice ajouté</p>
                <p className="text-muted-foreground">
                  Commencez par ajouter des exercices à cette séance
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {exercises.map((exercise, index) => (
                  <ExerciseItem
                    key={exercise.id}
                    exercise={exercise}
                    index={index}
                    onUpdate={handleUpdateExercise}
                    onDelete={handleDeleteExercise}
                    onMove={handleMoveExercise}
                    workoutType={workoutType}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={selectExerciseOpen} onOpenChange={setSelectExerciseOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Sélectionner un exercice</DialogTitle>
            <DialogDescription>
              Choisissez l'exercice à ajouter à la séance
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto">
            <ExerciseLibrary 
              onSelectExercise={handleAddExercise} 
              selectionMode={true}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Component pour afficher un exercice
const ExerciseItem: React.FC<{
  exercise: WorkoutExercise;
  index: number;
  onUpdate: (id: string, field: string, value: any) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  workoutType: 'classic' | 'circuit';
}> = ({ exercise, index, onUpdate, onDelete, onMove, workoutType }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                <h4 className="font-semibold">{exercise.exercise.libelle}</h4>
              </div>
              {exercise.exercise.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {exercise.exercise.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMove(exercise.id, 'up')}
                disabled={index === 0}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMove(exercise.id, 'down')}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(exercise.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="w-full"
          >
            {expanded ?'Masquer les détails' : 'Modifier les détails'}
          </Button>

          {expanded && (
            <div className="grid grid-cols-2 gap-3 pt-3 border-t">
              {workoutType === 'classic' && (
                <div>
                  <Label>Séries</Label>
                  <Input
                    type="number"
                    value={exercise.series || ''}
                    onChange={(e) => onUpdate(exercise.id, 'series', parseInt(e.target.value) || null)}
                  />
                </div>
              )}
              <div>
                <Label>Répétitions</Label>
                <Input
                  type="number"
                  value={exercise.reps || ''}
                  onChange={(e) => onUpdate(exercise.id, 'reps', parseInt(e.target.value) || null)}
                />
              </div>
              <div>
                <Label>Temps (secondes)</Label>
                <Input
                  type="number"
                  value={exercise.temps_seconds || ''}
                  onChange={(e) => onUpdate(exercise.id, 'temps_seconds', parseInt(e.target.value) || null)}
                />
              </div>
              <div>
                <Label>Charge cible (kg)</Label>
                <Input
                  type="number"
                  value={exercise.charge_cible || ''}
                  onChange={(e) => onUpdate(exercise.id, 'charge_cible', parseFloat(e.target.value) || null)}
                />
              </div>
              <div>
                <Label>Tempo</Label>
                <Input
                  value={exercise.tempo || ''}
                  onChange={(e) => onUpdate(exercise.id, 'tempo', e.target.value || null)}
                  placeholder="Ex: 3-1-1-0"
                />
              </div>
              <div>
                <Label>Couleur élastique</Label>
                <Input
                  value={exercise.couleur_elastique || ''}
                  onChange={(e) => onUpdate(exercise.id, 'couleur_elastique', e.target.value || null)}
                />
              </div>
              <div className="col-span-2">
                <Label>Conseils</Label>
                <Textarea
                  value={exercise.tips || ''}
                  onChange={(e) => onUpdate(exercise.id, 'tips', e.target.value || null)}
                  placeholder="Ajouter des conseils pour cet exercice..."
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
