import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

interface Client {
  id: string;
  handle: string;
  avatar_url: string | null;
}

interface Routine {
  id: string;
  title: string;
  type: 'exercises' | 'video';
}

interface AssignRoutinesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routines: Routine[];
}

export const AssignRoutinesDialog: React.FC<AssignRoutinesDialogProps> = ({
  open,
  onOpenChange,
  routines
}) => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchClientsAndAssignments();
    }
  }, [open]);

  const fetchClientsAndAssignments = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch clients
      const programs = await pb.collection('programs').getFullList({
        filter: `coach="${user.id}"`,
        expand: 'client',
      });

      const uniqueClients = Array.from(
        new Map(
          programs?.map((p: any) => [
            (p.expand?.client as any)?.id || p.client,
            {
              id: (p.expand?.client as any)?.id || p.client,
              handle: (p.expand?.client as any)?.handle || (p.expand?.client as any)?.name || (p.expand?.client as any)?.email || '',
              avatar_url: (p.expand?.client as any)?.avatar_url || (p.expand?.client as any)?.avatar || null
            }
          ]) || []
        ).values()
      ) as Client[];

      setClients(uniqueClients);

      // Fetch existing assignments
      const assignmentsData = await pb.collection('client_routines').getFullList({
        filter: `assigned_by="${user.id}"`,
      });

      const assignmentsMap: Record<string, string[]> = {};
      assignmentsData?.forEach(assignment => {
        if (assignment.active) {
          if (!assignmentsMap[assignment.client]) {
            assignmentsMap[assignment.client] = [];
          }
          assignmentsMap[assignment.client].push(assignment.routine);
        }
      });

      setAssignments(assignmentsMap);
    } catch (err: any) {
      console.error('Error fetching clients and assignments:', err);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const isAssigned = (clientId: string, routineId: string): boolean => {
    return assignments[clientId]?.includes(routineId) || false;
  };

  const toggleAssignment = async (clientId: string, routineId: string) => {
    if (!user) return;

    try {
      const currentlyAssigned = isAssigned(clientId, routineId);

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

        setAssignments(prev => ({
          ...prev,
          [clientId]: prev[clientId]?.filter(id => id !== routineId) || []
        }));
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

        setAssignments(prev => ({
          ...prev,
          [clientId]: [...(prev[clientId] || []), routineId]
        }));
      }

      toast.success('Assignation mise à jour');
    } catch (err: any) {
      console.error('Error toggling assignment:', err);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Assigner des routines aux clients</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-150px)]">
          {loading ?(
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
                    <div className="space-y-2">
                      {[...Array(2)].map((_, j) => (
                        <div key={j} className="h-8 bg-muted rounded"></div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : clients.length === 0 ?(
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Aucun client trouvé</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {clients.map(client => (
                <Card key={client.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      {client.avatar_url ?(
                        <img
                          src={client.avatar_url}
                          alt={client.handle}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-medium">
                            {client.handle?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold">{client.handle}</h3>
                        <Badge variant="secondary">
                          {assignments[client.id]?.length || 0} routine(s)
                        </Badge>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-3">
                      {routines.map(routine => (
                        <div
                          key={routine.id}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <Label
                              htmlFor={`${client.id}-${routine.id}`}
                              className="cursor-pointer"
                            >
                              {routine.title}
                            </Label>
                            <Badge variant="outline" className="ml-2 text-xs">
                              {routine.type === 'exercises' ?'Exercices' : 'Vidéo'}
                            </Badge>
                          </div>
                          <Switch
                            id={`${client.id}-${routine.id}`}
                            checked={isAssigned(client.id, routine.id)}
                            onCheckedChange={() => toggleAssignment(client.id, routine.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
