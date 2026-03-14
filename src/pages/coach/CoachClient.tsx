import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CoachLayout } from '@/components/layout/CoachLayout';
// TODO: remplacer par PocketBase
import { supabase } from '@/lib/supabase-stub';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProgramBuilder } from '@/components/coach/ProgramBuilder';
import { HabitManager } from '@/components/coach/HabitManager';
import { ClientRoutineManager } from '@/components/coach/ClientRoutineManager';

const CoachClient = () => {
  const { id } = useParams();
  const [client, setClient] = useState<any>(null);
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchClientData = async () => {
      try {
        // Fetch client info
        const { data: clientData, error: clientError } = await supabase
          .from('app_user')
          .select('*')
          .eq('id', id)
          .single();

        if (clientError) throw clientError;
        setClient(clientData);

        // Fetch program
        const { data: programData, error: programError } = await supabase
          .from('program')
          .select('*')
          .eq('client_id', id)
          .single();

        if (programError && programError.code !== 'PGRST116') {
          throw programError;
        }

        setProgram(programData);
      } catch (error) {
        console.error('Error fetching client:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [id]);

  if (loading) {
    return (
      <CoachLayout>
        <div className="p-6">Chargement...</div>
      </CoachLayout>
    );
  }

  if (!client) {
    return (
      <CoachLayout>
        <div className="p-6">Client non trouvé</div>
      </CoachLayout>
    );
  }

  return (
    <CoachLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={client.avatar_url} />
                <AvatarFallback>
                  {client.handle?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{client.handle}</CardTitle>
                <CardDescription>
                  {program ? `Programme: ${program.titre}` : 'Aucun programme actif'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {program ? (
          <Tabs defaultValue="workouts" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="workouts">Séances</TabsTrigger>
              <TabsTrigger value="habits">Habitudes</TabsTrigger>
              <TabsTrigger value="routines">Routines</TabsTrigger>
            </TabsList>
            <TabsContent value="workouts" className="mt-6">
              <ProgramBuilder programId={program.id} clientId={id!} />
            </TabsContent>
            <TabsContent value="habits" className="mt-6">
              <HabitManager clientId={id!} />
            </TabsContent>
            <TabsContent value="routines" className="mt-6">
              <ClientRoutineManager clientId={id!} />
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Ce client n'a pas encore de programme assigné
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </CoachLayout>
  );
};

export default CoachClient;