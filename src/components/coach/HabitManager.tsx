import React, { useState, useEffect } from 'react';
// TODO: remplacer par PocketBase
import { supabase } from '@/lib/supabase-stub';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClientHabitsTracker } from './ClientHabitsTracker';
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

interface Habit {
  id: string;
  titre: string;
  description?: string;
  key?: string;
  assignment?: {
    id: string;
    active: boolean;
  };
}

interface Props {
  clientId: string;
}

export const HabitManager: React.FC<Props> = ({ clientId }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewHabit, setShowNewHabit] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitDesc, setNewHabitDesc] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchHabits();
  }, [clientId]);

  const fetchHabits = async () => {
    try {
      // Get all habits
      const { data: habitsData, error: habitsError } = await supabase
        .from('habit')
        .select('*')
        .eq('owner', 'coach');

      if (habitsError) throw habitsError;

      // Get assignments for this client
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('habit_assignment')
        .select('*')
        .eq('client_id', clientId);

      if (assignmentsError) throw assignmentsError;

      // Merge data
      const assignmentsMap = new Map(
        assignmentsData?.map((a) => [a.habit_id, a]) || []
      );

      const mergedHabits = habitsData?.map((habit) => ({
        ...habit,
        assignment: assignmentsMap.get(habit.id),
      })) || [];

      setHabits(mergedHabits);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les habitudes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createHabit = async () => {
    if (!newHabitTitle.trim()) return;

    try {
      const { data: newHabit, error: habitError } = await supabase
        .from('habit')
        .insert({
          titre: newHabitTitle,
          description: newHabitDesc,
          owner: 'coach',
          default_active: false,
        })
        .select()
        .single();

      if (habitError) throw habitError;

      // Assign to client
      const { error: assignError } = await supabase.from('habit_assignment').insert({
        habit_id: newHabit.id,
        client_id: clientId,
        active: true,
      });

      if (assignError) throw assignError;

      toast({ title: 'Habitude créée avec succès' });
      setNewHabitTitle('');
      setNewHabitDesc('');
      setShowNewHabit(false);
      fetchHabits();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer l\'habitude',
        variant: 'destructive',
      });
    }
  };

  const toggleHabitAssignment = async (habitId: string, currentlyAssigned: boolean) => {
    try {
      if (currentlyAssigned) {
        // Deactivate
        const habit = habits.find((h) => h.id === habitId);
        if (habit?.assignment) {
          const { error } = await supabase
            .from('habit_assignment')
            .update({ active: false })
            .eq('id', habit.assignment.id);

          if (error) throw error;
        }
      } else {
        // Check if assignment exists
        const habit = habits.find((h) => h.id === habitId);
        if (habit?.assignment) {
          // Reactivate
          const { error } = await supabase
            .from('habit_assignment')
            .update({ active: true })
            .eq('id', habit.assignment.id);

          if (error) throw error;
        } else {
          // Create new assignment
          const { error } = await supabase.from('habit_assignment').insert({
            habit_id: habitId,
            client_id: clientId,
            active: true,
          });

          if (error) throw error;
        }
      }

      toast({ title: 'Habitude mise à jour' });
      fetchHabits();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier l\'habitude',
        variant: 'destructive',
      });
    }
  };

  const deleteHabit = async () => {
    if (!habitToDelete) return;

    try {
      // First delete all assignments
      const { error: assignmentError } = await supabase
        .from('habit_assignment')
        .delete()
        .eq('habit_id', habitToDelete);

      if (assignmentError) throw assignmentError;

      // Then delete the habit
      const { error: habitError } = await supabase
        .from('habit')
        .delete()
        .eq('id', habitToDelete);

      if (habitError) throw habitError;

      toast({ 
        title: 'Habitude supprimée',
        description: 'L\'habitude a été définitivement supprimée'
      });
      fetchHabits();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'habitude',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setHabitToDelete(null);
    }
  };

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="assign" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assign">Assigner habitudes</TabsTrigger>
          <TabsTrigger value="tracking">Suivi & Statistiques</TabsTrigger>
        </TabsList>

        <TabsContent value="assign" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Habitudes du client</h2>
            <Button onClick={() => setShowNewHabit(!showNewHabit)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle habitude
            </Button>
          </div>

      {showNewHabit && (
        <Card>
          <CardHeader>
            <CardTitle>Créer une nouvelle habitude</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Titre de l'habitude"
              value={newHabitTitle}
              onChange={(e) => setNewHabitTitle(e.target.value)}
            />
            <Textarea
              placeholder="Description (optionnel)"
              value={newHabitDesc}
              onChange={(e) => setNewHabitDesc(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={createHabit}>Créer</Button>
              <Button variant="outline" onClick={() => setShowNewHabit(false)}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {habits.map((habit) => {
          const isActive = habit.assignment?.active || false;
          return (
            <Card key={habit.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{habit.titre}</CardTitle>
                    {habit.description && (
                      <CardDescription>{habit.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={isActive}
                      onCheckedChange={() => toggleHabitAssignment(habit.id, isActive)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setHabitToDelete(habit.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
        </TabsContent>

        <TabsContent value="tracking">
          <ClientHabitsTracker clientId={clientId} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette habitude ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'habitude sera définitivement supprimée 
              pour tous les clients auxquels elle est assignée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteHabit}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
