import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CoachLayout } from '@/components/layout/CoachLayout';
import { useCoachClients } from '@/hooks/useCoachClients';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AssignClientDialog } from '@/components/coach/AssignClientDialog';
import { Users, Dumbbell, Calendar, TrendingUp, UserPlus } from 'lucide-react';

const CoachDashboard = () => {
  const { clients, loading, refetch } = useCoachClients();
  const navigate = useNavigate();
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  return (
    <CoachLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Coach</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de votre activité de coaching
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients Actifs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ?'...' : clients.length}</div>
              <p className="text-xs text-muted-foreground">
                Clients avec programmes actifs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Programmes</CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ?'...' : clients.length}</div>
              <p className="text-xs text-muted-foreground">
                Programmes en cours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Séances</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                Cette semaine
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progression</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                Taux de complétion moyen
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>Accédez rapidement aux fonctionnalités principales</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button onClick={() => navigate('/coach/clients')}>
              <Users className="mr-2 h-4 w-4" />
              Voir mes clients
            </Button>
            <Button variant="outline" onClick={() => navigate('/coach/builder/new')}>
              <Dumbbell className="mr-2 h-4 w-4" />
              Créer une séance
            </Button>
            <Button variant="outline" onClick={() => setShowAssignDialog(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Assigner un·e sportif·ve
            </Button>
          </CardContent>
        </Card>

        <AssignClientDialog
          open={showAssignDialog}
          onOpenChange={setShowAssignDialog}
          onSuccess={() => {
            refetch();
          }}
        />
      </div>
    </CoachLayout>
  );
};

export default CoachDashboard;