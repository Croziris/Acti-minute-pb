import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Play, Plus, Minus, CheckCircle } from 'lucide-react';
import { getYouTubeEmbedUrl, isYouTubeShort } from '@/lib/utils';

interface Exercise {
  exercise_id: string;
  order_index?: number;
  reps?: number | null;
  temps_seconds?: number | null;
  charge_cible?: number | null;
  tempo?: string | null;
  temps_repos_seconds?: number | null;
  rpe_cible?: number | null;
  couleur_elastique?: string | null;
  tips?: string | null;
  variations?: string | null;
  exercise: {
    id: string;
    libelle: string;
    description?: string;
    video_id?: string;
    youtube_url?: string;
    categories: string[];
    groupes: string[];
  };
}

interface CircuitExerciseCardProps {
  exercise: Exercise;
  index: number;
  sessionId: string;
  roundNumber: number;
  onExerciseDataChange?: (exerciseId: string, data: { reps: number; charge: number }) => void;
}

export const CircuitExerciseCard: React.FC<CircuitExerciseCardProps> = ({ 
  exercise: we, 
  index, 
  sessionId, 
  roundNumber,
  onExerciseDataChange
}) => {
  const [showVideo, setShowVideo] = useState(false);
  const [repsCompleted, setRepsCompleted] = useState<number | ''>(we.reps ?? '');
  const [charge, setCharge] = useState<number | ''>(we.charge_cible ?? '');
  const isShort = we.exercise?.youtube_url ?isYouTubeShort(we.exercise.youtube_url) : false;

  // Notifier le parent à chaque changement
  React.useEffect(() => {
    if (onExerciseDataChange) {
      onExerciseDataChange(we.exercise_id, {
        reps: repsCompleted === '' ? 0 : repsCompleted,
        charge: charge === '' ? 0 : charge,
      });
    }
  }, [repsCompleted, charge, we.exercise_id, onExerciseDataChange]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Badge variant="outline" className="font-mono mt-1">
              {index + 1}
            </Badge>
            <div className="flex-1">
              <CardTitle className="text-lg">{we.exercise.libelle}</CardTitle>
              {we.exercise.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {we.exercise.description}
                </p>
              )}
            </div>
          </div>
          
          {we.exercise.video_id && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowVideo(!showVideo)}
            >
              <Play className="h-4 w-4 mr-1" />
              Vidéo
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {we.exercise.categories?.map(cat => (
            <Badge key={cat} variant="secondary" className="text-xs">
              {cat}
            </Badge>
          ))}
          {we.exercise.groupes?.map(groupe => (
            <Badge key={groupe} variant="outline" className="text-xs">
              {groupe}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Video Player */}
        {showVideo && we.exercise.video_id && (
          <div className={isShort ?"flex justify-center" : "aspect-video w-full"}>
            <iframe
              src={getYouTubeEmbedUrl(we.exercise.video_id, isShort)}
              title={we.exercise.libelle}
              className={isShort ?"w-full max-w-[360px] h-[640px] rounded-lg" : "w-full h-full rounded-lg"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {/* Exercise Prescription */}
        <div className="p-4 bg-muted/30 rounded-lg space-y-3">
          {/* Affichage dynamique de TOUTES les variables renseignées */}
          <div className="grid grid-cols-2 gap-3">
            {/* Répétitions cibles */}
            {we.reps && (
              <div className="text-center p-2 bg-background rounded border border-border">
                <div className="font-semibold text-lg">{we.reps}</div>
                <div className="text-xs text-muted-foreground">Répétitions cibles</div>
              </div>
            )}
            
            {/* Temps (secondes) */}
            {we.temps_seconds && (
              <div className="text-center p-2 bg-background rounded border border-border">
                <div className="font-semibold text-lg">{we.temps_seconds}s</div>
                <div className="text-xs text-muted-foreground">Durée</div>
              </div>
            )}
            
            {/* Charge cible */}
            {we.charge_cible && (
              <div className="text-center p-2 bg-background rounded border border-border">
                <div className="font-semibold text-lg">{we.charge_cible}kg</div>
                <div className="text-xs text-muted-foreground">Charge cible</div>
              </div>
            )}
            
            {/* Tempo */}
            {we.tempo && (
              <div className="text-center p-2 bg-background rounded border border-border">
                <div className="font-semibold text-lg">{we.tempo}</div>
                <div className="text-xs text-muted-foreground">Tempo</div>
              </div>
            )}
            
            {/* Temps de repos */}
            {we.temps_repos_seconds && (
              <div className="text-center p-2 bg-background rounded border border-border">
                <div className="font-semibold text-lg">{we.temps_repos_seconds}s</div>
                <div className="text-xs text-muted-foreground">Repos</div>
              </div>
            )}
            
            {/* RPE cible */}
            {we.rpe_cible && (
              <div className="text-center p-2 bg-background rounded border border-border">
                <div className="font-semibold text-lg">{we.rpe_cible}/10</div>
                <div className="text-xs text-muted-foreground">RPE cible</div>
              </div>
            )}
            
            {/* Couleur élastique */}
            {we.couleur_elastique && (
              <div className="text-center p-2 bg-background rounded border border-border">
                <Badge variant="outline" className="text-sm">
                  {we.couleur_elastique}
                </Badge>
                <div className="text-xs text-muted-foreground mt-1">Élastique</div>
              </div>
            )}
          </div>

          {/* Logging Controls */}
          <div className="pt-3 border-t border-border space-y-3">
            <div className="text-sm font-medium text-center text-primary">
              📊 Tour {roundNumber}
            </div>
            
            {/* ✅ COMPTEUR DE RÉPÉTITIONS - TOUJOURS AFFICHÉ */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Répétitions réalisées
                {we.reps && (
                  <span className="ml-1 text-primary">(cible: {we.reps})</span>
                )}
              </label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRepsCompleted(Math.max(0, (repsCompleted === '' ? 0 : repsCompleted) - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={repsCompleted === 0 ? '' : repsCompleted}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRepsCompleted(val === '' ? '' : parseInt(val) || 0);
                  }}
                  className="text-center font-semibold"
                  placeholder="0"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRepsCompleted((repsCompleted === '' ? 0 : repsCompleted) + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Info contextuelle selon le type d'exercice */}
              {we.temps_seconds && !we.reps && (
                <p className="text-xs text-muted-foreground italic text-center">
                  💡 Note tes répétitions effectuées pendant les {we.temps_seconds}s
                </p>
              )}
            </div>

            {we.charge_cible && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Charge utilisée (kg)</label>
                <Input
                  type="number"
                  value={charge === 0 ? '' : charge}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCharge(val === '' ? '' : parseFloat(val) || 0);
                  }}
                  className="text-center"
                  step="0.5"
                />
              </div>
            )}

          </div>
        </div>

        {/* Tips & Variations */}
        {(we.tips || we.variations) && (
          <div className="space-y-2">
            {we.tips && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-400 rounded">
                <div className="text-sm font-medium text-blue-800 dark:text-blue-200">Conseil</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">{we.tips}</div>
              </div>
            )}
            {we.variations && (
              <div className="p-3 bg-green-50 dark:bg-green-950/30 border-l-4 border-green-400 rounded">
                <div className="text-sm font-medium text-green-800 dark:text-green-200">Variations</div>
                <div className="text-sm text-green-700 dark:text-green-300">{we.variations}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
