import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, History } from 'lucide-react';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';

interface RoutineWithTracking {
  id: string;
  title: string;
  tracking: {
    date: string;
    completed: boolean;
  }[];
}

interface ClientRoutineStatsProps {
  clientId: string;
}

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export const ClientRoutineStats: React.FC<ClientRoutineStatsProps> = ({ clientId }) => {
  const { user } = useAuth();
  const [routines, setRoutines] = useState<RoutineWithTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekDates, setWeekDates] = useState<string[]>([]);
  const [selectedRoutineHistory, setSelectedRoutineHistory] = useState<string | null>(null);
  const [historyDates, setHistoryDates] = useState<Date[]>([]);

  useEffect(() => {
    const dates = getCurrentWeekDates();
    setWeekDates(dates);
    fetchRoutinesAndTracking(dates);
  }, [clientId]);

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

  const fetchRoutinesAndTracking = async (dates: string[]) => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch assigned routines
      const assignedRoutines = await pb.collection('client_routines').getFullList({
        filter: `client="${clientId}" && assigned_by="${user.id}" && active=true`,
      });

      const routineIds = assignedRoutines?.map((ar: any) => ar.routine) || [];

      if (routineIds.length === 0) {
        setRoutines([]);
        return;
      }

      // Fetch routines details
      const routineFilter = routineIds.map((id) => `id="${id}"`).join(' || ');
      const routinesData = await pb.collection('routines').getFullList({
        filter: routineFilter,
      });

      // Fetch tracking data
      const trackingData = await pb.collection('routine_tracking').getFullList({
        filter: `client = "${clientId}"`,
      });

      // Map tracking to routines
      const trackingMap: Record<string, any[]> = {};
      trackingData?.forEach((track: any) => {
        const routineId = track.routine;
        const date = track.date?.split('T')[0] ?? null;
        const completed = track.completed === true;

        if (!routineId || !date || !routineIds.includes(routineId) || !dates.includes(date)) {
          return;
        }

        if (!trackingMap[routineId]) {
          trackingMap[routineId] = [];
        }
        trackingMap[routineId].push({
          date,
          completed
        });
      });

      const formattedRoutines: RoutineWithTracking[] = routinesData?.map((routine: any) => ({
        id: routine.id,
        title: routine.title,
        tracking: trackingMap[routine.id] || []
      })) || [];

      setRoutines(formattedRoutines);
    } catch (err: any) {
      console.error('Error fetching routines:', err);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const isCompleted = (routine: RoutineWithTracking, date: string): boolean => {
    const tracking = routine.tracking.find(t => t.date === date);
    return tracking?.completed || false;
  };

  const calculateCompletionRate = (): number => {
    if (routines.length === 0) return 0;
    
    const totalPossible = routines.length * 7;
    let totalCompleted = 0;
    
    routines.forEach(routine => {
      weekDates.forEach(date => {
        if (isCompleted(routine, date)) {
          totalCompleted++;
        }
      });
    });
    
    return Math.round((totalCompleted / totalPossible) * 100);
  };

  const getTotalCompletions = (): number => {
    let total = 0;
    routines.forEach(routine => {
      weekDates.forEach(date => {
        if (isCompleted(routine, date)) {
          total++;
        }
      });
    });
    return total;
  };

  const fetchRoutineHistory = async (routineId: string) => {
    try {
      const data = await pb.collection('routine_tracking').getFullList({
        filter: `client = "${clientId}" && routine = "${routineId}" && completed = true`,
        sort: '-date',
      });

      const dates = data
        ?.map((item: any) => new Date(item.date))
        .filter((date: Date) => !Number.isNaN(date.getTime())) || [];
      setHistoryDates(dates);
      setSelectedRoutineHistory(routineId);
    } catch (err: any) {
      console.error('Error fetching routine history:', err);
      toast.error('Erreur lors du chargement de l\'historique');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="h-64 bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  if (routines.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            Aucune routine assignée à ce client
          </p>
        </CardContent>
      </Card>
    );
  }

  const completionRate = calculateCompletionRate();
  const totalCompletions = getTotalCompletions();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taux de complétion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <Progress value={completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Routines réalisées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompletions}</div>
            <p className="text-xs text-muted-foreground mt-1">Cette semaine</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Routines assignées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{routines.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Actives</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suivi hebdomadaire</CardTitle>
          <CardDescription>
            Visualisez les routines réalisées par le client cette semaine
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Routine</th>
                  {DAYS.map((day, index) => (
                    <th key={index} className="text-center py-3 px-2 font-medium min-w-[60px]">
                      <div className="text-xs">{day}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(weekDates[index]).getDate()}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {routines.map(routine => (
                  <tr key={routine.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{routine.title}</div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => fetchRoutineHistory(routine.id)}
                              className="ml-2"
                            >
                              <History className="h-4 w-4 mr-1" />
                              Historique
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Historique - {routine.title}</DialogTitle>
                              <DialogDescription>
                                Tous les jours où cette routine a été validée par le client
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col items-center py-4">
                              <Calendar
                                mode="multiple"
                                selected={historyDates}
                                className="rounded-md border pointer-events-auto"
                                modifiers={{
                                  completed: historyDates
                                }}
                                modifiersStyles={{
                                  completed: {
                                    backgroundColor: 'hsl(var(--success))',
                                    color: 'white',
                                    fontWeight: 'bold'
                                  }
                                }}
                              />
                              <p className="text-sm text-muted-foreground mt-4">
                                Total : {historyDates.length} jour{historyDates.length > 1 ?'s' : ''} validé{historyDates.length > 1 ?'s' : ''}
                              </p>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </td>
                    {weekDates.map((date, index) => (
                      <td key={index} className="text-center py-3 px-2">
                        {isCompleted(routine, date) ?(
                          <CheckCircle2 className="h-6 w-6 text-success inline-block" />
                        ) : (
                          <Circle className="h-6 w-6 text-muted-foreground/30 inline-block" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
