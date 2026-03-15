import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { pb } from '@/lib/pocketbase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, XCircle, Dumbbell, Star, MessageSquare, AlertCircle, Layers } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SessionDetailsModalProps {
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
  id: string;
  exercise_id: string | null;
  circuit_number: number | null;
  feedback_type: string;
  rpe: number | null;
  plaisir_0_10: number | null;
  difficulte_0_10: number | null;
}

interface SessionDetails {
  id: string;
  statut: string;
  date_demarree: string | null;
  date_terminee: string | null;
  commentaire_fin: string | null;
  isCombined?: boolean;
  workouts?: Array<{
    id: string;
    titre: string;
    workout_type: string;
    session_type?: string;
    circuit_rounds: number | null;
  }>;
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
      workout_id?: string;
      workout_titre?: string;
      workout_session_type?: string;
      exercise: {
        libelle: string;
      };
    }>;
  };
}

export const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({
  open,
  onOpenChange,
  sessionId,
}) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [setLogs, setSetLogs] = useState<SetLog[]>([]);
  const [feedbacks, setFeedbacks] = useState<ExerciseFeedback[]>([]);
  const [circuitFeedbacks, setCircuitFeedbacks] = useState<ExerciseFeedback[]>([]);
  const [finalFeedback, setFinalFeedback] = useState<ExerciseFeedback | null>(null);

  useEffect(() => {
    if (open && sessionId) {
      fetchSessionDetails();
    }
  }, [open, sessionId]);

  const fetchSessionDetails = async () => {
    try {
      setLoading(true);

      // Récupérer les détails de la séance (combinée ou simple)
      const sessionData = await pb.collection('sessions').getOne(sessionId, {
        expand: 'workout',
      });

      const workoutIds = Array.isArray((sessionData as any).workout_ids)
        ? (sessionData as any).workout_ids
        : ((sessionData as any).workout ? [(sessionData as any).workout] : []);

      const workouts = await Promise.all(
        workoutIds.map(async (workoutId: string) => {
          const baseWorkout = (sessionData as any).expand?.workout?.id === workoutId
            ? (sessionData as any).expand.workout
            : await pb.collection('workout').getOne(workoutId);

          const workoutExercises = await pb.collection('workout_exercises').getFullList({
            filter: `workout="${workoutId}"`,
            sort: 'order_index',
            expand: 'exercise',
          });

          return {
            id: baseWorkout.id,
            titre: (baseWorkout as any).titre,
            workout_type: (baseWorkout as any).workout_type,
            session_type: (baseWorkout as any).session_type,
            circuit_rounds: (baseWorkout as any).circuit_rounds ?? null,
            workout_exercise: workoutExercises.map((we: any) => ({
              exercise_id: we.exercise,
              order_index: we.order_index,
              series: we.series ?? null,
              reps: we.reps ?? null,
              charge_cible: we.charge_cible ?? null,
              rpe_cible: we.rpe_cible ?? null,
              exercise: {
                libelle: we.expand?.exercise?.libelle || '',
              },
            })),
          };
        })
      );

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
        .filter((item: any) => item.progress_type === 'feedback')
        .map((item: any) => ({
          id: item.id,
          exercise_id: item.exercise ?? null,
          circuit_number: item.circuit_number ?? null,
          feedback_type: item.feedback_type || 'session',
          rpe: item.rpe ?? null,
          plaisir_0_10: item.plaisir_0_10 ?? null,
          difficulte_0_10: item.difficulte_0_10 ?? null,
        }));

      const exerciseFeedbacks = feedbacksData.filter((f) => f.exercise_id !== null);
      const circuitFbs = feedbacksData.filter((f) => f.feedback_type === 'circuit' && f.exercise_id === null);
      const finalFb = feedbacksData.find((f) => f.feedback_type === 'session' && f.exercise_id === null);

      const isCombined = workouts.length > 1;
      let transformedSession: SessionDetails;
      if (isCombined) {
        transformedSession = {
          id: sessionData.id,
          statut: (sessionData as any).statut,
          date_demarree: (sessionData as any).date_demarree ?? null,
          date_terminee: (sessionData as any).date_terminee ?? null,
          commentaire_fin: (sessionData as any).commentaire_fin ?? null,
          isCombined: true,
          workouts: workouts.map((w) => ({
            id: w.id,
            titre: w.titre,
            workout_type: w.workout_type,
            session_type: w.session_type,
            circuit_rounds: w.circuit_rounds,
          })),
          workout: {
            titre: 'Session combinée',
            workout_type: 'combined',
            circuit_rounds: null,
            workout_exercises: workouts.flatMap((w) =>
              (w.workout_exercise || []).map((we: any) => ({
                ...we,
                workout_id: w.id,
                workout_titre: w.titre,
                workout_session_type: w.session_type,
              }))
            ),
          },
        };
      } else {
        const workout = workouts[0] || {
          titre: '',
          workout_type: '',
          circuit_rounds: null,
          workout_exercise: [],
        };
        transformedSession = {
          id: sessionData.id,
          statut: (sessionData as any).statut,
          date_demarree: (sessionData as any).date_demarree ?? null,
          date_terminee: (sessionData as any).date_terminee ?? null,
          commentaire_fin: (sessionData as any).commentaire_fin ?? null,
          workout: {
            titre: workout.titre,
            workout_type: workout.workout_type,
            circuit_rounds: workout.circuit_rounds,
            workout_exercises: workout.workout_exercise || [],
          },
        };
      }

      setSession(transformedSession);
      setSetLogs(logsData);
      setFeedbacks(exerciseFeedbacks);
      setCircuitFeedbacks(circuitFbs);
      setFinalFeedback(finalFb || null);
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

  const getStatusInfo = (statut: string) => {
    const config: Record<string, { label: string; icon: any; color: string }> = {
      completed: { label: 'Complétée', icon: CheckCircle2, color: 'text-green-500' },
      skipped: { label: 'Sautée', icon: XCircle, color: 'text-red-500' },
      in_progress: { label: 'En cours', icon: Dumbbell, color: 'text-yellow-500' },
      planned: { label: 'Planifiée', icon: Clock, color: 'text-grey-500' }
    };
    return config[statut] || config.planned;
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

  const statusInfo = getStatusInfo(session.statut);
  const StatusIcon = statusInfo.icon;
  const duration = calculateSessionDuration();
  const isCircuitWorkout = session.workout.workout_type === 'circuit';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
            {session.isCombined && <Layers className="h-5 w-5 text-purple-600" />}
            {session.workout.titre}
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{statusInfo.label}</Badge>
            {session.isCombined && (
              <Badge variant="secondary" className="gap-1">
                <Layers className="h-3 w-3" />
                {session.workouts?.length} séances
              </Badge>
            )}
            {duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {duration} min
              </span>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-150px)] pr-4">
          {/* Section Feedbacks & Ressentis */}
          {session.statut === 'done' && (circuitFeedbacks.length > 0 || finalFeedback || feedbacks.length > 0 || session.commentaire_fin) && (
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Feedbacks & Ressentis du client</h3>
              </div>

              {/* Feedbacks par circuit */}
              {isCircuitWorkout && circuitFeedbacks.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">📊 Feedbacks par circuit</h4>
                  {circuitFeedbacks
                    .sort((a, b) => (a.circuit_number || 0) - (b.circuit_number || 0))
                    .map((feedback) => (
                      <Card key={feedback.id} className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Badge variant="outline">Circuit {feedback.circuit_number}</Badge>
                            Ressentis
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-3">
                            {feedback.rpe !== null && (
                              <div className="text-center p-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                <div className="text-xl font-bold text-orange-600">{feedback.rpe}/10</div>
                                <div className="text-xs text-muted-foreground mt-1">RPE</div>
                              </div>
                            )}
                            {feedback.difficulte_0_10 !== null && (
                              <div className="text-center p-2 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                                <div className="text-xl font-bold text-red-600">{feedback.difficulte_0_10}/10</div>
                                <div className="text-xs text-muted-foreground mt-1">Difficulté</div>
                              </div>
                            )}
                            {feedback.plaisir_0_10 !== null && (
                              <div className="text-center p-2 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="text-xl font-bold text-green-600">{feedback.plaisir_0_10}/10</div>
                                <div className="text-xs text-muted-foreground mt-1">Plaisir</div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}

              {/* Feedbacks par exercice (séances classiques) */}
              {!isCircuitWorkout && feedbacks.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">📋 Feedbacks par exercice</h4>
                  {feedbacks.map((feedback) => {
                    const exercise = session.workout.workout_exercises.find(
                      we => we.exercise_id === feedback.exercise_id
                    );
                    return (
                      <Card key={feedback.id} className="border-l-4 border-l-purple-500">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">
                            {exercise?.exercise.libelle || 'Exercice'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-3">
                            {feedback.difficulte_0_10 !== null && (
                              <div className="text-center p-2 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                                <div className="text-xl font-bold text-red-600">{feedback.difficulte_0_10}/10</div>
                                <div className="text-xs text-muted-foreground mt-1">Difficulté</div>
                              </div>
                            )}
                            {feedback.plaisir_0_10 !== null && (
                              <div className="text-center p-2 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="text-xl font-bold text-green-600">{feedback.plaisir_0_10}/10</div>
                                <div className="text-xs text-muted-foreground mt-1">Plaisir</div>
                              </div>
                            )}
                            {feedback.rpe !== null && (
                              <div className="text-center p-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                <div className="text-xl font-bold text-orange-600">{feedback.rpe}/10</div>
                                <div className="text-xs text-muted-foreground mt-1">RPE</div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Feedback final de séance */}
              {finalFeedback && (
                <Card className="border-2 border-primary">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Star className="h-4 w-4 text-primary" />
                      Feedback global de la séance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-3 gap-3">
                      {finalFeedback.rpe !== null && (
                        <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border-2 border-orange-200 dark:border-orange-800">
                          <div className="text-2xl font-bold text-orange-600">{finalFeedback.rpe}/10</div>
                          <div className="text-xs font-medium text-muted-foreground mt-2">RPE moyen</div>
                        </div>
                      )}
                      {finalFeedback.difficulte_0_10 !== null && (
                        <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border-2 border-red-200 dark:border-red-800">
                          <div className="text-2xl font-bold text-red-600">{finalFeedback.difficulte_0_10}/10</div>
                          <div className="text-xs font-medium text-muted-foreground mt-2">Difficulté globale</div>
                        </div>
                      )}
                      {finalFeedback.plaisir_0_10 !== null && (
                        <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                          <div className="text-2xl font-bold text-green-600">{finalFeedback.plaisir_0_10}/10</div>
                          <div className="text-xs font-medium text-muted-foreground mt-2">Plaisir global</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Commentaire final */}
              {session.commentaire_fin && (
                <Card className="border-l-4 border-l-primary">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Commentaire du client
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{session.commentaire_fin}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          
          {session.statut === 'planned' ? (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Cette séance n'a pas encore été commencée par le client.
                </p>
              </div>
              
              {/* Affichage des workouts pour sessions combinées */}
              {session.isCombined && session.workouts ? (
                <div className="space-y-6">
                  {session.workouts.map((workout, wIdx) => {
                    const workoutExercises = session.workout.workout_exercises.filter(
                      we => we.workout_id === workout.id
                    );
                    return (
                      <Card key={workout.id} className="border-l-4 border-l-purple-500">
                        <CardHeader className="bg-purple-50 dark:bg-purple-950/20">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">
                              {wIdx + 1}
                            </Badge>
                            <span className="text-xl">
                              {workout.session_type === 'warmup' && '🔥'}
                              {workout.session_type === 'main' && '💪'}
                              {workout.session_type === 'cooldown' && '🧘'}
                            </span>
                            <CardTitle className="text-lg">{workout.titre}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            {workoutExercises
                              .sort((a, b) => a.order_index - b.order_index)
                              .map((we, idx) => (
                                <div key={we.exercise_id} className="flex items-start gap-2 text-sm">
                                  <Badge variant="outline" className="text-xs mt-0.5">
                                    {idx + 1}
                                  </Badge>
                                  <div className="flex-1">
                                    <p className="font-medium">{we.exercise.libelle}</p>
                                    <p className="text-muted-foreground text-xs">
                                      {we.series} × {we.reps} reps
                                      {we.charge_cible && ` @ ${we.charge_cible}kg`}
                                      {we.rpe_cible && ` (RPE ${we.rpe_cible})`}
                                    </p>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-semibold">Exercices prévus :</h3>
                  {session.workout.workout_exercises
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((we, idx) => (
                      <Card key={we.exercise_id}>
                        <CardHeader>
                          <CardTitle className="text-lg">
                            {idx + 1}. {we.exercise.libelle}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm text-muted-foreground">
                            {we.series} × {we.reps} reps
                            {we.charge_cible && ` @ ${we.charge_cible}kg`}
                            {we.rpe_cible && ` (RPE ${we.rpe_cible})`}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {session.statut === 'in_progress' && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Séance en cours... Le client n'a pas encore terminé.
                  </p>
                </div>
              )}
              {session.workout.workout_exercises
                .sort((a, b) => a.order_index - b.order_index)
                .map((we, idx) => {
                  const logs = getSetLogsForExercise(we.exercise_id);
                  const feedback = getFeedbackForExercise(we.exercise_id);

                  return (
                    <Card key={we.exercise_id}>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {idx + 1}. {we.exercise.libelle}
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
                              {session.statut === 'in_progress' 
                                ? 'Pas encore commencé cet exercice'
                                : 'Aucune donnée enregistrée'
                              }
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
