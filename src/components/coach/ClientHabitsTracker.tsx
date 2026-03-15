import React, { useState, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle, Circle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HabitCheck {
  id: string;
  date: string;
  checked: boolean;
}

interface HabitAssignment {
  id: string;
  habit: {
    id: string;
    titre: string;
    description?: string;
  };
  checks: HabitCheck[];
}

interface Props {
  clientId: string;
}

export const ClientHabitsTracker: React.FC<Props> = ({ clientId }) => {
  const [habits, setHabits] = useState<HabitAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fourWeeksAgo = subWeeks(new Date(), 4);
  const weekStart = startOfWeek(fourWeeksAgo, { locale: fr });
  const weekEnd = endOfWeek(new Date(), { locale: fr });
  const allDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    fetchHabitsData();
  }, [clientId]);

  const fetchHabitsData = async () => {
    try {
      setLoading(true);

      // Récupérer les habitudes assignées
      const assignments = await pb.collection('habit_assignments').getFullList({
        filter: `client_id="${clientId}" && active=true`,
        expand: 'habit_id',
      });

      // Récupérer les checks des 4 dernières semaines
      const checks = await pb.collection('habit_checks').getFullList({
        filter: `client_id="${clientId}" && date >= "${format(fourWeeksAgo, 'yyyy-MM-dd')}"`,
      });

      // Grouper les checks par habit_id
      const checksMap = new Map<string, HabitCheck[]>();
      checks?.forEach((check: any) => {
        if (!checksMap.has(check.habit_id)) {
          checksMap.set(check.habit_id, []);
        }
        checksMap.get(check.habit_id)?.push(check as HabitCheck);
      });

      // Merger les données
      const habitsWithChecks = assignments?.map((assignment: any) => ({
        id: assignment.id,
        habit: {
          id: assignment.expand?.habit_id?.id || assignment.habit_id,
          titre: assignment.expand?.habit_id?.titre || '',
          description: assignment.expand?.habit_id?.description,
        },
        checks: checksMap.get(assignment.habit_id) || [],
      })) || [];

      setHabits(habitsWithChecks);
    } catch (error) {
      console.error('Error fetching habits:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les habitudes du client',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCompletionRate = (checks: HabitCheck[]) => {
    const totalDays = allDays.length;
    const checkedDays = checks.filter((c) => c.checked).length;
    return Math.round((checkedDays / totalDays) * 100);
  };

  const isDayChecked = (habitChecks: HabitCheck[], day: Date) => {
    return habitChecks.some(
      (check) => check.checked && isSameDay(new Date(check.date), day)
    );
  };

  if (loading) {
    return <div className="p-6">Chargement des habitudes...</div>;
  }

  if (habits.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Aucune habitude assignée à ce client</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Suivi des habitudes (4 dernières semaines)</h3>
      
      {habits.map((habit) => {
        const completionRate = getCompletionRate(habit.checks);
        const checkedCount = habit.checks.filter((c) => c.checked).length;

        return (
          <Card key={habit.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{habit.habit.titre}</CardTitle>
                  {habit.habit.description && (
                    <CardDescription>{habit.habit.description}</CardDescription>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{completionRate}%</div>
                  <div className="text-sm text-muted-foreground">
                    {checkedCount}/{allDays.length} jours
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {allDays.map((day) => {
                  const isChecked = isDayChecked(habit.checks, day);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={day.toISOString()}
                      className={`
                        aspect-square rounded-lg flex flex-col items-center justify-center p-1 text-xs
                        ${isChecked ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}
                        ${isToday ? 'ring-2 ring-primary' : ''}
                      `}
                    >
                      <span className="text-[10px] text-muted-foreground mb-1">
                        {format(day, 'dd/MM', { locale: fr })}
                      </span>
                      {isChecked ? (
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
