import React, { useState, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Calendar, Clock, Dumbbell, Eye, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AssignWorkoutDialog } from '@/components/coach/AssignWorkoutDialog';
import { SessionDetailsModal } from '@/components/coach/SessionDetailsModal';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
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

interface WeekPlan {
  id: string;
  iso_week: number;
  start_date: string;
  end_date: string;
  sessions: Session[];
}

interface Session {
  id: string;
  index_num: number;
  statut: string;
  isCombined?: boolean;
  workouts?: Array<{
    id: string;
    titre: string;
    description: string | null;
    duree_estimee: number | null;
    workout_type: string;
    session_type?: string;
  }>;
  workout: {
    titre: string;
    description: string | null;
    duree_estimee: number | null;
    workout_type: 'classic' | 'circuit' | 'combined';
    circuit_rounds: number | null;
  };
}

interface Props {
  programId: string;
  clientId: string;
}

export const ProgramBuilder: React.FC<Props> = ({ programId, clientId }) => {
  const [weekPlans, setWeekPlans] = useState<WeekPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchWeekPlans();
  }, [programId]);

  const fetchWeekPlans = async () => {
    try {
      setLoading(true);

      const weekPlansData = await pb.collection('week_plans').getFullList({
        filter: `program = "${programId}"`,
        sort: 'start_date',
      });

      const organized: WeekPlan[] = [];
      for (const wp of (weekPlansData || [])) {
        // fix: séquentiel pour éviter auto-cancellation PocketBase
        const sessionsData = await pb.collection('sessions').getFullList({
          filter: `week_plan = "${wp.id}"`,
          sort: 'index_num',
        });

        const normalizedSessions: Session[] = [];
        for (const s of sessionsData) {
          // fix: séquentiel pour éviter auto-cancellation PocketBase
          const workoutIds = Array.isArray(s.workout_ids)
            ? s.workout_ids
            : (s.workout ? [s.workout] : []);

          if (workoutIds.length > 1) {
            const workouts: any[] = [];
            for (const workoutId of workoutIds) {
              workouts.push(await pb.collection('workout').getOne(workoutId));
            }
            normalizedSessions.push({
              id: s.id,
              index_num: s.index_num,
              statut: s.statut,
              isCombined: true,
              workouts: workouts.map((w: any) => ({
                id: w.id,
                titre: w.titre,
                description: w.description ?? null,
                duree_estimee: w.duree_estimee ?? null,
                workout_type: w.workout_type,
                session_type: w.session_type,
              })),
              workout: {
                titre: workouts.map((w: any) => w.titre).join(' + '),
                description: `${workouts.length} séances combinées`,
                duree_estimee: workouts.reduce((sum: number, w: any) => sum + (w.duree_estimee || 0), 0),
                workout_type: 'combined',
                circuit_rounds: null,
              },
            } as Session);
          } else if (s.workout) {
            const workout = await pb.collection('workout').getOne(s.workout);
            normalizedSessions.push({
              id: s.id,
              index_num: s.index_num,
              statut: s.statut,
              isCombined: false,
              workout: {
                titre: (workout as any).titre,
                description: (workout as any).description ?? null,
                duree_estimee: (workout as any).duree_estimee ?? null,
                workout_type: (workout as any).workout_type || 'classic',
                circuit_rounds: (workout as any).circuit_rounds ?? null,
              },
            } as Session);
          } else {
            normalizedSessions.push({
              id: s.id,
              index_num: s.index_num,
              statut: s.statut,
              isCombined: false,
              workout: {
                titre: 'Séance sans workout',
                description: null,
                duree_estimee: null,
                workout_type: 'classic',
                circuit_rounds: null,
              },
            } as Session);
          }
        }

        organized.push({
          id: wp.id,
          iso_week: wp.iso_week,
          start_date: wp.start_date,
          end_date: wp.end_date,
          sessions: normalizedSessions.sort((a, b) => a.index_num - b.index_num),
        } as WeekPlan);
      }

      // Trier les semaines : semaine actuelle en premier, puis futures, puis passées
      // Normaliser la date actuelle Ã  minuit pour comparer correctement avec les dates de début/fin
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const sorted = organized.sort((a, b) => {
        const aStart = parseISO(a.start_date);
        aStart.setHours(0, 0, 0, 0);
        const aEnd = parseISO(a.end_date);
        aEnd.setHours(23, 59, 59, 999);
        const bStart = parseISO(b.start_date);
        bStart.setHours(0, 0, 0, 0);
        const bEnd = parseISO(b.end_date);
        bEnd.setHours(23, 59, 59, 999);

        const aIsCurrent = now >= aStart && now <= aEnd;
        const bIsCurrent = now >= bStart && now <= bEnd;

        // Semaine actuelle toujours en premier
        if (aIsCurrent && !bIsCurrent) return -1;
        if (!aIsCurrent && bIsCurrent) return 1;

        // Sinon, ordre chronologique
        return aStart.getTime() - bStart.getTime();
      });

      setWeekPlans(sorted);
    } catch (error: any) {
      console.error('Error fetching week plans:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le programme',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;

    try {
      await pb.collection('sessions').delete(sessionToDelete);

      toast({
        title: 'Séance supprimée',
        description: 'La séance a été retirée du programme'
      });

      fetchWeekPlans();
    } catch (error: any) {
      console.error('Error deleting session:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la séance',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  const getStatusBadge = (statut: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      planned: { label: 'À faire', variant: 'outline' },
      in_progress: { label: 'En cours', variant: 'default' },
      completed: { label: 'Terminée', variant: 'secondary' },
      skipped: { label: 'Sautée', variant: 'destructive' }
    };

    const config = statusConfig[statut] || statusConfig.planned;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleSessionClick = (session: Session) => {
    setSelectedSessionId(session.id);
    setDetailsModalOpen(true);
  };

  if (loading) {
    return <div className="p-6">Chargement du programme...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Programme d'entraînement</h2>
          <p className="text-muted-foreground">
            Assignez des séances au client par semaine
          </p>
        </div>
        <Button onClick={() => setAssignDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une séance
        </Button>
      </div>

      {weekPlans.length === 0 ?(
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Aucune séance planifiée</p>
            <p className="text-muted-foreground text-center mb-4">
              Commencez par ajouter des séances au programme de votre client
            </p>
            <Button onClick={() => setAssignDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une séance
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {weekPlans.map((weekPlan) => {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const weekStart = parseISO(weekPlan.start_date);
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = parseISO(weekPlan.end_date);
            weekEnd.setHours(23, 59, 59, 999);
            const isCurrentWeek = now >= weekStart && now <= weekEnd;
            
            return (
              <Card key={weekPlan.id} className={isCurrentWeek ?'border-primary border-2' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {isCurrentWeek && (
                          <Badge variant="default" className="mr-2">Semaine actuelle</Badge>
                        )}
                        Semaine du {format(parseISO(weekPlan.start_date), 'dd MMM', { locale: fr })} au{' '}
                        {format(parseISO(weekPlan.end_date), 'dd MMM yyyy', { locale: fr })}
                      </CardTitle>
                      <CardDescription>
                        {weekPlan.sessions.length} séance{weekPlan.sessions.length > 1 ?'s' : ''} planifiée{weekPlan.sessions.length > 1 ?'s' : ''}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              <CardContent>
                {weekPlan.sessions.length === 0 ?(
                  <p className="text-muted-foreground text-center py-4">
                    Aucune séance pour cette semaine
                  </p>
                ) : (
                  <div className="space-y-3">
                    {weekPlan.sessions.map((session) => (
                      <Card 
                        key={session.id} 
                        className={`border-l-4 cursor-pointer hover:shadow-md transition-shadow ${
                          session.isCombined ?'border-l-purple-500' : 'border-l-primary'
                        }`}
                        onClick={() => handleSessionClick(session)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Badge variant="default">Séance {session.index_num}</Badge>
                                {getStatusBadge(session.statut)}
                                {session.isCombined && (
                                  <Badge variant="secondary" className="gap-1">
                                    <Layers className="h-3 w-3" />
                                    Combinée
                                  </Badge>
                                )}
                                {!session.isCombined && session.workout.workout_type === 'circuit' && (
                                  <Badge variant="secondary">Circuit</Badge>
                                )}
                                <Badge variant="outline" className="gap-1">
                                  <Eye className="h-3 w-3" />
                                  Voir détails
                                </Badge>
                              </div>
                              
                              {session.isCombined && session.workouts ?(
                                <div className="space-y-2">
                                  <CardTitle className="text-lg mb-2">Session combinée</CardTitle>
                                  {session.workouts.map((w, idx) => (
                                    <div key={w.id} className="flex items-center gap-2 text-sm">
                                      <Badge variant="outline" className="text-xs">
                                        {idx + 1}
                                      </Badge>
                                      <span>
                                        {w.session_type === 'warmup' && 'ðŸ”¥'}
                                        {w.session_type === 'main' && 'ðŸ’ª'}
                                        {w.session_type === 'cooldown' && 'ðŸ§˜'}
                                        {!w.session_type && 'ðŸ“‹'}
                                      </span>
                                      <span className="font-medium">{w.titre}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <>
                                  <CardTitle className="text-lg">{session.workout.titre}</CardTitle>
                                  {session.workout.description && (
                                    <CardDescription className="mt-1">
                                      {session.workout.description}
                                    </CardDescription>
                                  )}
                                </>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSessionToDelete(session.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {session.workout.duree_estimee && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{session.workout.duree_estimee} min</span>
                              </div>
                            )}
                            {!session.isCombined && session.workout.workout_type === 'circuit' && session.workout.circuit_rounds && (
                              <div className="flex items-center gap-1">
                                <Dumbbell className="h-4 w-4" />
                                <span>{session.workout.circuit_rounds} tour{session.workout.circuit_rounds > 1 ?'s' : ''}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      <AssignWorkoutDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        clientId={clientId}
        programId={programId}
        onSuccess={fetchWeekPlans}
      />

      {selectedSessionId && (
        <SessionDetailsModal
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          sessionId={selectedSessionId}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette séance ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La séance sera retirée du programme.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSession}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
