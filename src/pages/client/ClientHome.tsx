import React, { useState } from 'react';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Play, Trophy, TrendingUp, Wifi, WifiOff, Eye, History } from 'lucide-react';
import { useWeeklyProgram } from '@/hooks/useWeeklyProgram';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useNavigate } from 'react-router-dom';
import { SessionHistoryModal } from '@/components/client/SessionHistoryModal';
import { useAuth } from '@/contexts/AuthContext';
import { pb } from '@/lib/pocketbase';
import { useQuery } from '@tanstack/react-query';

const ClientHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { weekPlan, loading } = useWeeklyProgram();
  const { isOnline, pendingSync } = useOfflineSync();
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Récupérer l'historique des séances
  const { data: pastSessions } = useQuery({
    queryKey: ['past-sessions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const records = await pb.collection('sessions').getFullList({
        filter: `client = "${user.id}" && (statut = "done" || statut = "skipped")`,
        sort: '-date_terminee',
        expand: 'workout,week_plan',
      });

      return records.slice(0, 20).map((record: any) => ({
        ...record,
        workout: record.expand?.workout
          ?{
              titre: record.expand.workout.titre,
              description: record.expand.workout.description,
              duree_estimee: record.expand.workout.duree_estimee,
            }
          : null,
        week_plan: record.expand?.week_plan
          ?{
              start_date: record.expand.week_plan.start_date,
              end_date: record.expand.week_plan.end_date,
            }
          : null,
      }));
    },
    enabled: !!user
  });

  const handleStartSession = (sessionId: string) => {
    navigate(`/client/session/${sessionId}`);
  };

  const handleViewHistory = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setHistoryModalOpen(true);
  };

  const getSessionStatusText = (status: string) => {
    switch (status) {
      case 'done': return 'Terminée ✅';
      case 'ongoing': return 'En cours 🔄';
      case 'skipped': return 'Sautée ⏭️';
      default: return 'À faire';
    }
  };

  return (
    <ClientLayout>
      <div className="space-y-6">
        {/* Offline Banner */}
        {!isOnline && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded">
            <div className="flex items-center">
              <WifiOff className="h-5 w-5 text-yellow-600 mr-2" />
              <p className="text-yellow-800 text-sm">
                Mode hors-ligne — vos données seront synchronisées à la reconnexion.
                {pendingSync > 0 && ` (${pendingSync} éléments en attente)`}
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-gradient-card rounded-xl p-6 shadow-lg">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Bonjour {user?.name || 'sportif'}
          </h1>
          <p className="text-muted-foreground">
            Prêt(e) pour votre séance d'aujourd'hui ?
          </p>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cette semaine</p>
                  <p className="text-xl font-bold">
                    {weekPlan ?
                      `${weekPlan.sessions.filter(s => s.statut === 'done').length}/${weekPlan.sessions.length}` 
                      : '0/0'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <p className="text-xl font-bold">
                    {isOnline ?'En ligne' : 'Hors ligne'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Programme et Historique */}
        <Card>
          <Tabs defaultValue="current" className="w-full">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="current">
                  <Calendar className="h-4 w-4 mr-2" />
                  Cette semaine
                </TabsTrigger>
                <TabsTrigger value="history">
                  <History className="h-4 w-4 mr-2" />
                  Historique
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <TabsContent value="current" className="mt-0">
              <CardContent className="space-y-3">
                {loading ?(
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse bg-muted/50 rounded-lg h-16"></div>
                    ))}
                  </div>
                ) : weekPlan && weekPlan.sessions.length > 0 ?(
                  weekPlan.sessions.map((session, index) => {
                    const isNext = session.statut === 'planned' && 
                                 !weekPlan.sessions.slice(0, index).some(s => s.statut === 'planned');
                    
                    return (
                      <div 
                        key={session.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          isNext ?'bg-primary/5 border-l-4 border-primary' : 'bg-muted/50'
                        }`}
                      >
                        <div>
                          <h4 className="font-medium">
                            Séance {session.index_num} - {session.workout?.titre || 'Séance'}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {session.workout?.duree_estimee ?`${session.workout.duree_estimee} min • ` : ''}
                            {getSessionStatusText(session.statut)}
                          </p>
                        </div>
                        
                        {session.statut === 'planned' && isNext && (
                          <Button 
                            size="sm" 
                            className="bg-gradient-primary"
                            onClick={() => handleStartSession(session.id)}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Commencer
                          </Button>
                        )}
                        
                        {session.statut === 'ongoing' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleStartSession(session.id)}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Reprendre
                          </Button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-medium mb-2">Aucune séance programmée</h3>
                    <p className="text-sm text-muted-foreground">
                      Votre coach n'a pas encore créé de programme pour cette semaine.
                    </p>
                  </div>
                )}
              </CardContent>
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <CardContent className="space-y-3">
                {pastSessions && pastSessions.length > 0 ?(
                  pastSessions.map((session: any) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                      onClick={() => handleViewHistory(session.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">
                            {session.workout?.titre || 'Séance'}
                          </h4>
                          <Badge variant={session.statut === 'done' ?'default' : 'destructive'}>
                            {session.statut === 'done' ?'Terminée' : 'Sautée'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {session.date_terminee && new Date(session.date_terminee).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-medium mb-2">Pas d'historique</h3>
                    <p className="text-sm text-muted-foreground">
                      Vos séances terminées apparaîtront ici
                    </p>
                  </div>
                )}
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Actions rapides */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="h-16 flex flex-col items-center justify-center space-y-1"
            onClick={() => navigate('/client/habits')}
          >
            <Calendar className="h-5 w-5" />
            <span className="text-sm">Mes habitudes</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-16 flex flex-col items-center justify-center space-y-1"
            onClick={() => navigate('/client/articles')}
          >
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm">Articles</span>
          </Button>
        </div>

        {/* Session History Modal */}
        {selectedSessionId && (
          <SessionHistoryModal
            open={historyModalOpen}
            onOpenChange={setHistoryModalOpen}
            sessionId={selectedSessionId}
          />
        )}
      </div>
    </ClientLayout>
  );
};

export default ClientHome;
