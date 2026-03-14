import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
// TODO: remplacer par PocketBase
import { supabase } from '@/lib/supabase-stub';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

interface Routine {
  id: string;
  title: string;
  type: 'exercises' | 'video';
  description: string | null;
}

interface ClientRoutineAssignmentProps {
  clientId: string;
}

export const ClientRoutineAssignment: React.FC<ClientRoutineAssignmentProps> = ({ clientId }) => {
  const { user } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [assignedRoutineIds, setAssignedRoutineIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoutinesAndAssignments();
  }, [clientId]);

  const fetchRoutinesAndAssignments = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch coach's routines
      const { data: routinesData, error: routinesError } = await supabase
        .from('routines')
        .select('id, title, type, description')
        .eq('coach_id', user.id);

      if (routinesError) throw routinesError;

      setRoutines(routinesData || []);

      // Fetch assigned routines for this client
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('client_routines')
        .select('routine_id')
        .eq('client_id', clientId)
        .eq('assigned_by', user.id)
        .eq('active', true);

      if (assignmentsError) throw assignmentsError;

      setAssignedRoutineIds(assignmentsData?.map(a => a.routine_id) || []);
    } catch (err: any) {
      console.error('Error fetching routines:', err);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const isAssigned = (routineId: string): boolean => {
    return assignedRoutineIds.includes(routineId);
  };

  const toggleAssignment = async (routineId: string) => {
    if (!user) return;

    try {
      const currentlyAssigned = isAssigned(routineId);

      if (currentlyAssigned) {
        // Remove assignment
        const { error } = await supabase
          .from('client_routines')
          .update({ active: false })
          .eq('client_id', clientId)
          .eq('routine_id', routineId)
          .eq('assigned_by', user.id);

        if (error) throw error;

        setAssignedRoutineIds(prev => prev.filter(id => id !== routineId));
        toast.success('Routine retirée');
      } else {
        // Check if assignment exists but is inactive
        const { data: existing } = await supabase
          .from('client_routines')
          .select('id')
          .eq('client_id', clientId)
          .eq('routine_id', routineId)
          .eq('assigned_by', user.id)
          .maybeSingle();

        if (existing) {
          // Reactivate
          const { error } = await supabase
            .from('client_routines')
            .update({ active: true })
            .eq('id', existing.id);

          if (error) throw error;
        } else {
          // Create new assignment
          const { error } = await supabase
            .from('client_routines')
            .insert({
              client_id: clientId,
              routine_id: routineId,
              assigned_by: user.id,
              active: true
            });

          if (error) throw error;
        }

        setAssignedRoutineIds(prev => [...prev, routineId]);
        toast.success('Routine assignée');
      }
    } catch (err: any) {
      console.error('Error toggling assignment:', err);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (routines.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            Aucune routine disponible. Créez d'abord des routines dans "Mes Routines".
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assigner des routines</CardTitle>
        <CardDescription>
          Sélectionnez les routines que ce client peut voir et pratiquer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 mb-4">
          <Badge variant="secondary">
            {assignedRoutineIds.length} routine(s) assignée(s)
          </Badge>
        </div>

        <Separator className="my-4" />

        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {routines.map(routine => (
              <div
                key={routine.id}
                className="flex items-start justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors border"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor={`routine-${routine.id}`}
                      className="cursor-pointer font-medium"
                    >
                      {routine.title}
                    </Label>
                    <Badge variant="outline" className="text-xs">
                      {routine.type === 'exercises' ? 'Exercices' : 'Vidéo'}
                    </Badge>
                  </div>
                  {routine.description && (
                    <p className="text-sm text-muted-foreground">
                      {routine.description}
                    </p>
                  )}
                </div>
                <Switch
                  id={`routine-${routine.id}`}
                  checked={isAssigned(routine.id)}
                  onCheckedChange={() => toggleAssignment(routine.id)}
                />
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
