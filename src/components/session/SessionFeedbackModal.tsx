import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Star, Zap, Heart } from 'lucide-react';

interface SessionFeedbackModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (feedback: {
    rpe: number;
    difficulte: number;
    plaisir: number;
    commentaire?: string;
  }) => void;
}

export const SessionFeedbackModal: React.FC<SessionFeedbackModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
}) => {
  const [rpe, setRpe] = useState(5);
  const [difficulte, setDifficulte] = useState(5);
  const [plaisir, setPlaisir] = useState(5);
  const [commentaire, setCommentaire] = useState('');

  const handleSubmit = () => {
    onSubmit({
      rpe,
      difficulte,
      plaisir,
      commentaire: commentaire || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">🎉 Séance terminée !</DialogTitle>
          <DialogDescription>
            Comment s'est passée ta séance ?Ton feedback aide ton coach à adapter ton programme.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* RPE Moyen */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              <label className="text-sm font-semibold">
                Effort moyen (RPE: {rpe}/10)
              </label>
            </div>
            <Slider
              value={[rpe]}
              onValueChange={(value) => setRpe(value[0])}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Très facile</span>
              <span>Maximal</span>
            </div>
          </div>

          {/* Difficulté technique */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-500" />
              <label className="text-sm font-semibold">
                Difficulté technique ({difficulte}/10)
              </label>
            </div>
            <Slider
              value={[difficulte]}
              onValueChange={(value) => setDifficulte(value[0])}
              min={0}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Facile</span>
              <span>Très difficile</span>
            </div>
          </div>

          {/* Plaisir */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              <label className="text-sm font-semibold">
                Plaisir ({plaisir}/10)
              </label>
            </div>
            <Slider
              value={[plaisir]}
              onValueChange={(value) => setPlaisir(value[0])}
              min={0}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Pas plaisant</span>
              <span>Très plaisant</span>
            </div>
          </div>

          {/* Commentaire optionnel */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Commentaire (optionnel)
            </label>
            <Textarea
              placeholder="Des ressentis à partager ?Une douleur ?Un exercice que tu as particulièrement aimé ?"
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              className="min-h-[80px] resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} className="w-full" size="lg">
            Valider le feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
