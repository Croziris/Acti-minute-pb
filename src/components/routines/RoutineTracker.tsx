import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Calendar, Play } from 'lucide-react';
import { useRoutines, Routine } from '@/hooks/useRoutines';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { extractYouTubeVideoId, getYouTubeEmbedUrl, isYouTubeShort } from '@/lib/utils';

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export const RoutineTracker: React.FC = () => {
  const { routines, loading, error, toggleRoutineCheck } = useRoutines();
  const [selectedRoutine, setSelectedRoutine] = React.useState<Routine | null>(null);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3 mb-4"></div>
              <div className="flex space-x-2">
                {[...Array(7)].map((_, j) => (
                  <div key={j} className="w-8 h-8 bg-muted rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-destructive">Erreur: {error}</p>
        </CardContent>
      </Card>
    );
  }

  const getCurrentWeekDates = (): string[] => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ?6 : currentDay - 1));
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  const weekDates = getCurrentWeekDates();
  const today = new Date().toISOString().split('T')[0];
  const normalizeDate = (value: string): string => value.split('T')[0].split(' ')[0];

  const getRoutineScore = (routine: Routine): number => {
    return (
      routine.tracking?.filter(
        (track) => weekDates.includes(normalizeDate(track.date)) && track.completed
      ).length || 0
    );
  };

  const isDateChecked = (routine: Routine, date: string): boolean => {
    return (
      routine.tracking?.some(
        (track) => normalizeDate(track.date) === normalizeDate(date) && track.completed
      ) || false
    );
  };

  const isDateInFuture = (date: string): boolean => {
    return date > today;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  if (routines.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-medium mb-2">Aucune routine assignée</h3>
          <p className="text-sm text-muted-foreground">
            Votre coach vous assignera des routines à effectuer.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Week Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Semaine du {formatDate(weekDates[0])} au {formatDate(weekDates[6])}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {DAYS_FR.map((day, index) => (
                <div key={day} className="text-center">
                  <div className="text-xs font-medium text-muted-foreground mb-1">{day}</div>
                  <div className={`text-sm p-1 rounded ${
                    weekDates[index] === today 
                      ?'bg-primary text-primary-foreground font-medium'
                      : 'text-muted-foreground'
                  }`}>
                    {formatDate(weekDates[index])}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Routines List */}
        {routines.map(routine => {
          const score = getRoutineScore(routine);
          
          return (
            <Card key={routine.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{routine.title}</CardTitle>
                    {routine.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {routine.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={score >= 5 ?"default" : score >= 3 ?"secondary" : "destructive"}
                    >
                      {score}/7
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedRoutine(routine)}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Voir
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {weekDates.map((date, index) => {
                    const isChecked = isDateChecked(routine, date);
                    const isFuture = isDateInFuture(date);
                    const isToday = date === today;
                    
                    return (
                      <div key={date} className="text-center">
                        <Button
                          variant={isChecked ?"default" : "outline"}
                          size="sm"
                          className={`w-full h-10 p-0 ${
                            isToday ?'ring-2 ring-primary ring-offset-2' : ''
                          } ${
                            isFuture ?'opacity-50 cursor-not-allowed' : ''
                          }`}
                          onClick={() => !isFuture && toggleRoutineCheck(routine.id, date)}
                          disabled={isFuture}
                        >
                          {isChecked ?(
                            <Check className="h-4 w-4" />
                          ) : (
                            <span className="text-xs">{DAYS_FR[index]}</span>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {score}/7 jours cette semaine
                  </span>
                  <span className={`font-medium ${
                    score >= 5 ?'text-green-600' : 
                    score >= 3 ?'text-yellow-600' : 
                    'text-red-600'
                  }`}>
                    {score >= 5 ?'Excellent !' : 
                     score >= 3 ?'Bien' : 
                     'À améliorer'}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Routine Viewer Dialog */}
      <Dialog open={!!selectedRoutine} onOpenChange={() => setSelectedRoutine(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedRoutine?.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {selectedRoutine && (
              <div className="space-y-6">
                {selectedRoutine.description && (
                  <p className="text-muted-foreground">{selectedRoutine.description}</p>
                )}

                {selectedRoutine.type === 'video' && selectedRoutine.video_url && (
                  <div className={isYouTubeShort(selectedRoutine.video_url) ?'aspect-[9/16] max-w-md mx-auto' : 'aspect-video'}>
                    {extractYouTubeVideoId(selectedRoutine.video_url) && (
                      <iframe
                        src={getYouTubeEmbedUrl(extractYouTubeVideoId(selectedRoutine.video_url)!, isYouTubeShort(selectedRoutine.video_url))}
                        className="w-full h-full rounded-lg"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    )}
                  </div>
                )}

                {selectedRoutine.type === 'exercises' && selectedRoutine.exercises && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Exercices:</h3>
                    {selectedRoutine.exercises.map((ex, idx) => (
                      <Card key={ex.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <Badge variant="outline" className="mt-1">{idx + 1}</Badge>
                            <div className="flex-1">
                              <h4 className="font-medium">{ex.exercise.libelle}</h4>
                              {ex.exercise.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {ex.exercise.description}
                                </p>
                              )}
                              {ex.repetitions && (
                                <p className="text-sm font-medium mt-2">
                                  {ex.repetitions} répétitions
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {selectedRoutine.tips && selectedRoutine.tips.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Conseils:</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {selectedRoutine.tips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};
