import React, { useState, useEffect } from 'react';
import { CoachLayout } from '@/components/layout/CoachLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, Dumbbell, Edit, Trash2, Copy, ClipboardList, ArrowLeft } from 'lucide-react';
import { pb } from '@/lib/pocketbase';
import { useToast } from '@/hooks/use-toast';
import { CreateWorkoutDialog } from '@/components/coach/CreateWorkoutDialog';
import { WorkoutEditor } from '@/components/coach/WorkoutEditor';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Workout {
  id: string;
  titre: string;
  description: string | null;
  duree_estimee: number | null;
  workout_type: 'classic' | 'circuit';
  session_type: 'warmup' | 'main' | 'cooldown';
  circuit_rounds: number | null;
  nombre_circuits: number;
  circuit_configs: Array<{ rounds: number; rest: number }> | null;
  created_at: string;
  exercise_count?: number;
}

const CoachWorkouts = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState<string | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const { toast } = useToast();

  const mapWorkoutRecord = (workout: any, exerciseCount: number): Workout => ({
    id: workout.id,
    titre: workout.titre,
    description: workout.description ?? null,
    duree_estimee: workout.duree_estimee ?? null,
    workout_type: (workout.workout_type || 'classic') as 'classic' | 'circuit',
    session_type: (workout.session_type || 'main') as 'warmup' | 'main' | 'cooldown',
    circuit_rounds: workout.circuit_rounds ?? null,
    nombre_circuits: Array.isArray(workout.circuit_configs)
      ? workout.circuit_configs.length
      : (workout.nombre_circuits || 1),
    circuit_configs: workout.circuit_configs || [{ rounds: 3, rest: 60 }],
    created_at: workout.created_at || workout.created || '',
    exercise_count: exerciseCount,
  });

  const fetchWorkouts = async () => {
    try {
      setLoading(true);

      const workoutsData = await pb.collection('workout').getFullList({
        filter: 'is_template = true',
        sort: '-created',
      });

      const workoutsWithCount = await Promise.all(
        workoutsData.map(async (workout) => {
          const countResult = await pb.collection('workout_exercises').getList(1, 1, {
            filter: `workout = "${workout.id}"`,
          });

          return mapWorkoutRecord(workout, countResult.totalItems);
        })
      );

      setWorkouts(workoutsWithCount);
    } catch (error: any) {
      console.error('Error fetching workouts:', error);
      toast({
        title: "Erreur",
        description: error?.response?.message || error?.message || "Impossible de charger les séances",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const handleDeleteWorkout = async () => {
    if (!workoutToDelete) return;

    try {
      const workoutExercises = await pb.collection('workout_exercises').getFullList({
        filter: `workout = "${workoutToDelete}"`,
      });

      await Promise.all(
        workoutExercises.map((exercise) => pb.collection('workout_exercises').delete(exercise.id))
      );

      await pb.collection('workout').delete(workoutToDelete);

      toast({
        title: "Séance supprimée",
        description: "La séance a été supprimée avec succès"
      });

      fetchWorkouts();
    } catch (error: any) {
      console.error('Error deleting workout:', error);
      toast({
        title: "Erreur",
        description: error?.response?.message || error?.message || "Impossible de supprimer la séance",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setWorkoutToDelete(null);
    }
  };

  const handleDuplicateWorkout = async (workoutId: string) => {
    try {
      const workout = await pb.collection('workout').getOne(workoutId);

      const exercises = await pb.collection('workout_exercises').getFullList({
        filter: `workout = "${workoutId}"`,
        sort: 'order_index',
      });

      const newWorkout = await pb.collection('workout').create({
        titre: `${workout.titre} (copie)`,
        description: workout.description ?? null,
        duree_estimee: workout.duree_estimee ?? null,
        workout_type: workout.workout_type ?? 'classic',
        session_type: workout.session_type ?? 'main',
        circuit_rounds: workout.circuit_rounds ?? null,
        nombre_circuits: workout.nombre_circuits || 1,
        circuit_configs: workout.circuit_configs ?? null,
        temps_repos_tours_seconds: workout.temps_repos_tours_seconds ?? null,
        is_template: true,
      });

      if (exercises.length > 0) {
        await Promise.all(
          exercises.map((ex) =>
            pb.collection('workout_exercises').create({
              workout: newWorkout.id,
              exercise: ex.exercise_id,
              order_index: ex.order_index,
              series: ex.series,
              reps: ex.reps,
              temps_seconds: ex.temps_seconds,
              charge_cible: ex.charge_cible,
              tempo: ex.tempo,
              temps_repos_seconds: ex.temps_repos_seconds,
              rpe_cible: ex.rpe_cible,
              tips: ex.tips,
              variations: ex.variations,
              couleur: ex.couleur,
              couleur_elastique: ex.couleur_elastique ?? null,
              circuit_number: ex.circuit_number || 1,
            })
          )
        );
      }

      toast({
        title: "Séance dupliquée",
        description: "La séance a été dupliquée avec succès"
      });

      fetchWorkouts();
    } catch (error: any) {
      console.error('Error duplicating workout:', error);
      toast({
        title: "Erreur",
        description: error?.response?.message || error?.message || "Impossible de dupliquer la séance",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <CoachLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </CoachLayout>
    );
  }

  // Mode édition d'une séance
  if (editingWorkout) {
    return (
      <CoachLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingWorkout(null)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </div>
          
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{editingWorkout.titre}</h1>
              <Badge variant={editingWorkout.workout_type === 'circuit' ? 'default' : 'secondary'}>
                {editingWorkout.workout_type === 'circuit' ? 'Circuit' : 'Classique'}
              </Badge>
            </div>
            {editingWorkout.description && (
              <p className="text-muted-foreground">{editingWorkout.description}</p>
            )}
          </div>

          <WorkoutEditor
            workoutId={editingWorkout.id}
            workoutType={editingWorkout.workout_type}
            circuitRounds={editingWorkout.circuit_rounds || undefined}
            nombreCircuits={editingWorkout.nombre_circuits}
            circuitConfigs={editingWorkout.circuit_configs || undefined}
          />
        </div>
      </CoachLayout>
    );
  }

  // Mode liste des séances
  return (
    <CoachLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Mes Séances</h1>
            <p className="text-muted-foreground">
              Créez et gérez vos séances réutilisables
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Créer une séance
          </Button>
        </div>

        {workouts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Aucune séance créée</p>
              <p className="text-muted-foreground text-center mb-4">
                Commencez par créer votre première séance template
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer ma première séance
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workouts.map((workout) => (
              <Card key={workout.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {workout.session_type === 'warmup' && (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                            🔥 Échauffement
                          </Badge>
                        )}
                        {workout.session_type === 'main' && (
                          <Badge variant="default" className="bg-blue-600">
                            💪 Principale
                          </Badge>
                        )}
                        {workout.session_type === 'cooldown' && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                            🧘 Retour au Calme
                          </Badge>
                        )}
                        <Badge variant={workout.workout_type === 'circuit' ? 'default' : 'secondary'}>
                          {workout.workout_type === 'circuit' ? 'Circuit' : 'Classique'}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{workout.titre}</CardTitle>
                      {workout.description && (
                        <CardDescription className="mt-1">
                          {workout.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {workout.duree_estimee && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{workout.duree_estimee} min</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Dumbbell className="h-4 w-4" />
                      <span>{workout.exercise_count} exercice{workout.exercise_count > 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {workout.workout_type === 'circuit' && workout.circuit_rounds && (
                    <div className="text-sm">
                      <Badge variant="outline">
                        {workout.circuit_rounds} tour{workout.circuit_rounds > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setEditingWorkout(workout)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Éditer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicateWorkout(workout.id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setWorkoutToDelete(workout.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateWorkoutDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchWorkouts}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette séance ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La séance sera supprimée définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWorkout}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CoachLayout>
  );
};

export default CoachWorkouts;



