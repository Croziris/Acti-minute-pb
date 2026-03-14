import React, { useState, useEffect } from 'react';
// TODO: remplacer par PocketBase
import { supabase } from '@/lib/supabase-stub';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Search } from 'lucide-react';

interface Client {
  id: string;
  handle: string;
  avatar_url?: string;
  coach_handle?: string;
  is_available: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AssignClientDialog: React.FC<Props> = ({ open, onOpenChange, onSuccess }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      fetchAvailableClients();
    }
  }, [open]);

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredClients(clients);
    } else {
      setFilteredClients(
        clients.filter((c) =>
          c.handle.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search, clients]);

  const fetchAvailableClients = async () => {
    try {
      setLoading(true);
      
      // Récupérer tous les sportif⸱ve
      const { data: allClients, error: clientsError } = await supabase
        .from('app_user')
        .select('id, handle, avatar_url')
        .eq('role', 'spotif.ve');

      if (clientsError) throw clientsError;

      // Récupérer tous les programmes avec les infos des coaches
      const { data: allPrograms, error: programsError } = await supabase
        .from('program')
        .select(`
          client_id,
          coach_id,
          coach:coach_id (
            handle
          )
        `);

      if (programsError) throw programsError;

      // Créer une map des clients avec leur coach
      const clientCoachMap = new Map();
      allPrograms?.forEach((p: any) => {
        clientCoachMap.set(p.client_id, {
          coach_id: p.coach_id,
          coach_handle: p.coach?.handle || 'Coach inconnu'
        });
      });

      // Enrichir les clients avec les infos d'assignation
      const enrichedClients = allClients?.map((c) => {
        const assignment = clientCoachMap.get(c.id);
        return {
          ...c,
          coach_handle: assignment?.coach_handle,
          is_available: !assignment || assignment.coach_id === user?.id
        };
      }) || [];

      setClients(enrichedClients);
      setFilteredClients(enrichedClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les sportif·ves',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignClient = async (clientId: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('link-client-to-coach', {
        body: { client_id: clientId },
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: 'Erreur',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Succès',
        description: 'Sportif·ve lié·e avec succès',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error assigning client:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de lier le/la sportif·ve',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assigner un·e sportif·ve</DialogTitle>
          <DialogDescription>
            Sélectionnez un·e sportif·ve à ajouter à vos clients
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement...
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {search ? 'Aucun résultat' : 'Aucun·e sportif·ve trouvé·e'}
              </div>
            ) : (
              filteredClients.map((client) => (
                <div
                  key={client.id}
                  className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                    client.is_available ? 'hover:bg-accent' : 'opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar>
                      <AvatarImage src={client.avatar_url} />
                      <AvatarFallback>
                        {client.handle.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{client.handle}</span>
                      {client.coach_handle && (
                        <span className="text-xs text-muted-foreground">
                          Assigné·e à {client.coach_handle}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAssignClient(client.id)}
                    disabled={loading || !client.is_available}
                  >
                    {client.is_available ? 'Assigner' : 'Non disponible'}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
