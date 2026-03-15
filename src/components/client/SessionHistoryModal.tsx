import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { pb } from '@/lib/pocketbase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, XCircle, Star } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SessionHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
}

interface SetLog {
  id: string;
  exercise_id: string;
  index_serie: number;
  reps: number | null;
  charge: number | null;
  rpe: number | null;
  commentaire: string | null;
}

interface ExerciseFeedback {
  exercise_id: string;
  plaisir_0_10: number | null;
  difficulte_0_10: number | null;
}

interface SessionDetails {
  id: string;
  statut: string;
  date_demarree: string | null;
  date_terminee: string | null;
  commentaire_fin: string | null;
  workout: {
    titre: string;
    workout_type: string;
    circuit_rounds: number | null;
    workout_exercises: Array<{
      exercise_id: string;
      order_index: number;
      series: number | null;
      reps: number | null;
      charge_cible: number | null;
      rpe_cible: number | null;
      exercise: {
        libelle: string;
      };
    }>;
  };
}

export const SessionHistoryModal: React.FC<SessionHistoryModalProps> = ({
  open,
  onOpenChange,
  sessionId,
}) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [setLogs, setSetLogs] = useState<SetLog[]>([]);
  const [feedbacks, setFeedbacks] = useState<ExerciseFeedback[]>([]);

  useEffect(() => {
    if (open && sessionId) {
      fetchSessionDetails();
    }
  }, [open, sessionId]);

  const fetchSessionDetails = async () => {
    try {
      setLoading(true);

      const sessionData = await pb.collection('sessions').getOne(sessionId, {
        expand: 'workout',
      });

      const workoutId = (sessionData as any).workout;
      const workoutData = (sessionData as any).expand?.workout;
      const workoutExercises = workoutId
        ? await pb.collection('workout_exercises').getFullList({
            filter: `workout="${workoutId}"`,
            sort: 'order_index',
            expand: 'exercise',
          })
        : [];

      const progressData = await pb.collection('session_progress').getFullList({
        filter: `session="${sessionId}"`,
        sort: 'exercise,index_serie',
      });

      const logsData: SetLog[] = progressData
        .filter((item: any) => item.progress_type === 'set_log')
        .map((item: any) => ({
          id: item.id,
          exercise_id: item.exercise,
          index_serie: item.index_serie,
          reps: item.reps ?? null,
          charge: item.charge ?? null,
          rpe: item.rpe ?? null,
          commentaire: item.commentaire ?? null,
        }));

      const feedbacksData: ExerciseFeedback[] = progressData
        .filter((item: any) => item.progress_type === 'feedback' && item.exercise)
        .map((item: any) => ({
          exercise_id: item.exercise,
          plaisir_0_10: item.plaisir_0_10 ?? null,
          difficulte_0_10: item.difficulte_0_10 ?? null,
        }));

      const normalizedSession: SessionDetails = {
        id: sessionData.id,
        statut: (sessionData as any).statut,
        date_demarree: (sessionData as any).date_demarree ?? null,
        date_terminee: (sessionData as any).date_terminee ?? null,
        commentaire_fin: (sessionData as any).commentaire_fin ?? null,
        workout: {
          titre: workoutData?.titre || '',
          workout_type: workoutData?.workout_type || '',
          circuit_rounds: workoutData?.circuit_rounds ?? null,
          workout_exercises: workoutExercises.map((item: any) => ({
            exercise_id: item.exercise,
            order_index: item.order_index,
            series: item.series ?? null,
            reps: item.reps ?? null,
            charge_cible: item.charge_cible ?? null,
            rpe_cible: item.rpe_cible ?? null,
            exercise: {
              libelle: item.expand?.exercise?.libelle || '',
            },
          })),
        },
      };

      setSession(normalizedSession);
      setSetLogs(logsData);
      setFeedbacks(feedbacksData);
    } catch (error) {
      console.error('Error fetching session details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSetLogsForExercise = (exerciseId: string) => {
    return setLogs.filter(log => log.exercise_id === exerciseId);
  };

  const getFeedbackForExercise = (exerciseId: string) => {
    return feedbacks.find(fb => fb.exercise_id === exerciseId);
  };

  const calculateSessionDuration = () => {
    if (!session?.date_demarree || !session?.date_terminee) return null;
    const start = new Date(session.date_demarree);
    const end = new Date(session.date_terminee);
    const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
    return minutes;
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Chargement...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  if (!session) return null;

  const duration = calculateSessionDuration();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {session.statut === 'done' ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            {session.workout.titre}
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">
              {session.statut === 'done' ? 'Terminée' : 'Sautée'}
            </Badge>
            {duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {duration} min
              </span>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-150px)] pr-4">
          {session.commentaire_fin && (
            <Card className="mb-4 border-primary/20">
              <CardHeader>
                <CardTitle className="text-base">Mon commentaire de fin de séance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm italic text-muted-foreground">"{session.commentaire_fin}"</p>
              </CardContent>
            </Card>
          )}
          
          <div className="space-y-4">
            {session.workout.workout_exercises
              .sort((a, b) => a.order_index - b.order_index)
              .map((we, idx) => {
                const logs = getSetLogsForExercise(we.exercise_id);
                const feedback = getFeedbackForExercise(we.exercise_id);

                return (
                  <Card key={we.exercise_id}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>
                          {idx + 1}. {we.exercise.libelle}
                        </span>
                        {feedback && (
                          <div className="flex items-center gap-3 text-sm font-normal">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              😊 {feedback.plaisir_0_10}/10
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              💪 {feedback.difficulte_0_10}/10
                            </span>
                          </div>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground mb-3">
                          Prévu: {we.series} × {we.reps} reps
                          {we.charge_cible && ` @ ${we.charge_cible}kg`}
                          {we.rpe_cible && ` (RPE ${we.rpe_cible})`}
                        </div>

                        {logs.length > 0 ? (
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Réalisé:</div>
                            {logs.map((log) => (
                              <div
                                key={log.id}
                                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                              >
                                <div className="flex items-center gap-4">
                                  <Badge variant="outline">Série {log.index_serie}</Badge>
                                  <span className="text-sm">
                                    {log.reps} reps
                                  </span>
                                  {log.charge && (
                                    <span className="text-sm text-muted-foreground">
                                      {log.charge} kg
                                    </span>
                                  )}
                                  {log.rpe && (
                                    <span className="flex items-center gap-1 text-sm">
                                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                      RPE {log.rpe}
                                    </span>
                                  )}
                                </div>
                                {log.commentaire && (
                                  <span className="text-sm text-muted-foreground italic">
                                    {log.commentaire}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground italic">
                            Aucune donnée enregistrée
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
