import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronUp, ChevronDown, Trash2, Plus, Layers } from 'lucide-react';
import { pb } from '@/lib/pocketbase';
import { useToast } from '@/hooks/use-toast';

interface Workout {
  id: string;
  titre: string;
  description?: string;
  session_type: 'warmup' | 'main' | 'cooldown';
  workout_type: 'classic' | 'circuit';
  duree_estimee?: number;
}

interface CombinedWorkoutsBuilderProps {
  onWorkoutsChange: (workouts: Workout[]) => void;
}

export const CombinedWorkoutsBuilder: React.FC<CombinedWorkoutsBuilderProps> = ({
  onWorkoutsChange
}) => {
  const { toast } = useToast();
  const [availableWorkouts, setAvailableWorkouts] = useState<Workout[]>([]);
  const [selectedWorkouts, setSelectedWorkouts] = useState<Workout[]>([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>('');

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      const data = await pb.collection('workout').getFullList({
        filter: 'is_template=true',
        sort: 'titre',
      });
      setAvailableWorkouts((data || []) as unknown as Workout[]);
    } catch (error) {
      console.error('Error loading workouts:', error);
    }
  };

  const handleAddWorkout = () => {
    if (!selectedWorkoutId) return;
    
    const workout = availableWorkouts.find(w => w.id === selectedWorkoutId);
    if (!workout) return;
    
    if (selectedWorkouts.some(w => w.id === workout.id)) {
      toast({
        title: "Séance déjà ajoutée",
        description: "Cette séance est déjà dans la combinaison",
        variant: "destructive"
      });
      return;
    }
    
    const newWorkouts = [...selectedWorkouts, workout];
    setSelectedWorkouts(newWorkouts);
    onWorkoutsChange(newWorkouts);
    setSelectedWorkoutId('');
    
    toast({
      title: "Séance ajoutée",
      description: `"${workout.titre}" a été ajoutée à la combinaison`,
    });
  };

  const handleRemoveWorkout = (index: number) => {
    const newWorkouts = selectedWorkouts.filter((_, i) => i !== index);
    setSelectedWorkouts(newWorkouts);
    onWorkoutsChange(newWorkouts);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newWorkouts = [...selectedWorkouts];
    [newWorkouts[index - 1], newWorkouts[index]] = [newWorkouts[index], newWorkouts[index - 1]];
    setSelectedWorkouts(newWorkouts);
    onWorkoutsChange(newWorkouts);
  };

  const handleMoveDown = (index: number) => {
    if (index === selectedWorkouts.length - 1) return;
    const newWorkouts = [...selectedWorkouts];
    [newWorkouts[index], newWorkouts[index + 1]] = [newWorkouts[index + 1], newWorkouts[index]];
    setSelectedWorkouts(newWorkouts);
    onWorkoutsChange(newWorkouts);
  };

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case 'warmup': return '🔥';
      case 'main': return '💪';
      case 'cooldown': return '🧘';
      default: return '📋';
    }
  };

  const getSessionTypeLabel = (type: string) => {
    switch (type) {
      case 'warmup': return 'Échauffement';
      case 'main': return 'Principale';
      case 'cooldown': return 'Retour au calme';
      default: return '';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ajouter une séance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={selectedWorkoutId} onValueChange={setSelectedWorkoutId}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une séance..." />
            </SelectTrigger>
            <SelectContent>
              {availableWorkouts.map(workout => (
                <SelectItem key={workout.id} value={workout.id}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getSessionTypeIcon(workout.session_type)}</span>
                    <div className="flex flex-col">
                      <span className="font-medium">{workout.titre}</span>
                      <span className="text-xs text-muted-foreground">
                        {getSessionTypeLabel(workout.session_type)} • {workout.workout_type === 'circuit' ? 'Circuit' : 'Classique'}
                        {workout.duree_estimee && ` • ${workout.duree_estimee}min`}
                      </span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleAddWorkout} 
            disabled={!selectedWorkoutId}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter à la combinaison
          </Button>
        </CardContent>
      </Card>

      {selectedWorkouts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Séances combinées ({selectedWorkouts.length})
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Ordre d'exécution du haut vers le bas
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedWorkouts.map((workout, index) => (
              <Card key={`${workout.id}-${index}`} className="border-l-4" style={{
                borderLeftColor: 
                  workout.session_type === 'warmup' ? '#f97316' :
                  workout.session_type === 'main' ? '#3b82f6' :
                  '#10b981'
              }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === selectedWorkouts.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Badge variant="outline" className="font-mono">
                      {index + 1}
                    </Badge>
                    
                    <span className="text-2xl">{getSessionTypeIcon(workout.session_type)}</span>
                    
                    <div className="flex-1">
                      <div className="font-medium">{workout.titre}</div>
                      <div className="text-xs text-muted-foreground">
                        {getSessionTypeLabel(workout.session_type)}
                        {' • '}
                        {workout.workout_type === 'circuit' ? 'Circuit' : 'Classique'}
                        {workout.duree_estimee && ` • ${workout.duree_estimee}min`}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveWorkout(index)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {selectedWorkouts.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              Aucune séance ajoutée. Commencez par sélectionner une séance ci-dessus.
            </p>
          </CardContent>
        </Card>
      )}

      {selectedWorkouts.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Durée totale estimée</span>
              <span className="font-bold text-lg">
                {selectedWorkouts.reduce((sum, w) => sum + (w.duree_estimee || 0), 0)} min
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
