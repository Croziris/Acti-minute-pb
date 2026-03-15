import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { pb } from '@/lib/pocketbase';
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
      const routinesData = await pb.collection('routines').getFullList({
        filter: `coach="${user.id}"`,
      });

      setRoutines(routinesData as unknown as Routine[]);

      // Fetch assigned routines for this client
      const assignmentsData = await pb.collection('client_routines').getFullList({
        filter: `client="${clientId}" && assigned_by="${user.id}" && active=true`,
      });

      setAssignedRoutineIds(assignmentsData?.map((a: any) => a.routine) || []);
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
        const existingAssignments = await pb.collection('client_routines').getFullList({
          filter: `client="${clientId}" && routine="${routineId}" && assigned_by="${user.id}"`,
        });
        await Promise.all(
          existingAssignments.map((assignment: any) =>
            pb.collection('client_routines').update(assignment.id, { active: false })
          )
        );

        setAssignedRoutineIds(prev => prev.filter(id => id !== routineId));
        toast.success('Routine retirée');
      } else {
        // Check if assignment exists but is inactive
        const existingRecords = await pb.collection('client_routines').getFullList({
          filter: `client="${clientId}" && routine="${routineId}" && assigned_by="${user.id}"`,
          sort: '-created',
        });
        const existing = existingRecords[0];

        if (existing) {
          // Reactivate
          await pb.collection('client_routines').update(existing.id, { active: true });
        } else {
          // Create new assignment
          await pb.collection('client_routines').create({
            client: clientId,
            routine: routineId,
            assigned_by: user.id,
            active: true
          });
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
                      {routine.type === 'exercises' ?'Exercices' : 'Vidéo'}
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
