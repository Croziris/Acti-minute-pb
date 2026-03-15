import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Calendar } from 'lucide-react';
import { useHabits, Habit } from '@/hooks/useHabits';

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export const HabitTracker: React.FC = () => {
  const { habits, loading, error, toggleHabitCheck } = useHabits();

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
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

  const getHabitScore = (habit: Habit): number => {
    const checkedDays = habit.checks.filter(check => check.checked).length;
    return Math.round((checkedDays / 7) * 100);
  };

  const isDateChecked = (habit: Habit, date: string): boolean => {
    return habit.checks.some(check => check.date === date && check.checked);
  };

  const isDateInFuture = (date: string): boolean => {
    return date > today;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  if (habits.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-medium mb-2">Aucune habitude assignée</h3>
          <p className="text-sm text-muted-foreground">
            Votre coach vous assignera des habitudes à suivre.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
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
          <div className="grid grid-cols-7 gap-2 mb-4">
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

      {/* Habits List */}
      {habits.map(habit => {
        const score = getHabitScore(habit);
        
        return (
          <Card key={habit.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{habit.titre}</CardTitle>
                  {habit.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {habit.description}
                    </p>
                  )}
                </div>
                <Badge 
                  variant={score >= 70 ?"default" : score >= 40 ?"secondary" : "destructive"}
                  className="ml-2"
                >
                  {score}%
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {weekDates.map((date, index) => {
                  const isChecked = isDateChecked(habit, date);
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
                        onClick={() => !isFuture && toggleHabitCheck(habit.id, date)}
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
                  {habit.checks.filter(c => c.checked).length}/7 jours cette semaine
                </span>
                <span className={`font-medium ${
                  score >= 70 ?'text-green-600' : 
                  score >= 40 ?'text-yellow-600' : 
                  'text-red-600'
                }`}>
                  {score >= 70 ?'Excellent !' : 
                   score >= 40 ?'Bien' : 
                   'À améliorer'}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};