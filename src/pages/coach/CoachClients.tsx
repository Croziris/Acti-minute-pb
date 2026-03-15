import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CoachLayout } from '@/components/layout/CoachLayout';
import { useCoachClients } from '@/hooks/useCoachClients';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, ChevronRight } from 'lucide-react';

const CoachClients = () => {
  const { clients, loading } = useCoachClients();
  const navigate = useNavigate();

  if (loading) {
    return (
      <CoachLayout>
        <div className="p-6">Chargement...</div>
      </CoachLayout>
    );
  }

  return (
    <CoachLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mes Clients</h1>
          <p className="text-muted-foreground">
            Gérez les programmes et habitudes de vos clients
          </p>
        </div>

        {clients.length === 0 ?(
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Aucun client assigné pour le moment
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <Card
                key={client.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/coach/client/${client.id}`)}
              >
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={client.avatar} />
                      <AvatarFallback>
                        {(client.name || '?').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{client.name}</CardTitle>
                      {client.program && (
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Badge variant="secondary">{client.program.statut}</Badge>
                          <span>{client.program.titre}</span>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                {client.program?.objectif && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {client.program.objectif}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </CoachLayout>
  );
};

export default CoachClients;
