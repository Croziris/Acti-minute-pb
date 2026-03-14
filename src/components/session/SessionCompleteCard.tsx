import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trophy, MessageCircle } from 'lucide-react';
// TODO: remplacer par PocketBase
import { supabase } from '@/lib/supabase-stub';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface SessionCompleteCardProps {
  sessionId: string;
  coachPhoneNumber?: string;
  commentaireFin?: string;
  onCommentChange?: (comment: string) => void;
}

export const SessionCompleteCard: React.FC<SessionCompleteCardProps> = ({ 
  sessionId, 
  coachPhoneNumber,
  commentaireFin = '',
  onCommentChange
}) => {
  const [comment, setComment] = useState(commentaireFin);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCommentChange = (value: string) => {
    setComment(value);
    if (onCommentChange) {
      onCommentChange(value);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('session')
        .update({
          statut: 'done',
          date_terminee: new Date().toISOString(),
          commentaire_fin: comment || null,
        })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "🎉 Séance terminée !",
        description: "Félicitations pour cette séance !",
      });

      // Rediriger vers l'accueil client
      navigate('/client/home');
    } catch (error) {
      console.error('Error completing session:', error);
      toast({
        title: "Erreur",
        description: "Impossible de terminer la séance",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppContact = () => {
    const message = comment 
      ? `Séance terminée ! Mes ressentis : ${comment}`
      : 'Séance terminée ! Je voulais te partager mes ressentis.';
    
    const phoneNumber = coachPhoneNumber || '';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-200 dark:border-green-800">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-green-500/20 rounded-full">
            <Trophy className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-green-900 dark:text-green-100">
          🎉 Bravo ! Séance terminée !
        </CardTitle>
        <p className="text-green-700 dark:text-green-300 mt-2">
          Tu as accompli tous les circuits avec succès
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Zone de commentaire */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-green-900 dark:text-green-100">
            N'hésite pas à partager tes ressentis avec ton coach
          </label>
          <Textarea
            placeholder="Comment s'est passée la séance ? Des difficultés ? Des progrès ?"
            value={comment}
            onChange={(e) => handleCommentChange(e.target.value)}
            className="min-h-[120px] bg-white dark:bg-gray-900 border-green-200 dark:border-green-800 focus:border-green-400 dark:focus:border-green-600"
            rows={5}
          />
        </div>

        {/* Boutons d'action */}
        <div className="space-y-3">
          {/* Bouton WhatsApp */}
          {coachPhoneNumber && (
            <Button
              onClick={handleWhatsAppContact}
              variant="outline"
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700 text-white border-green-700 dark:bg-green-700 dark:hover:bg-green-800"
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Contacter mon coach sur WhatsApp
            </Button>
          )}

          {/* Bouton Terminer */}
          <Button
            onClick={handleComplete}
            disabled={isSubmitting}
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting ? 'Enregistrement...' : 'Terminer et revenir à l\'accueil'}
          </Button>
        </div>

        {/* Message info */}
        <p className="text-xs text-center text-green-700 dark:text-green-400 mt-4">
          Ton coach pourra consulter tes performances et ressentis dans ton historique
        </p>
      </CardContent>
    </Card>
  );
};
