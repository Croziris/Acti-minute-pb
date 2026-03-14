import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Play, Filter, Youtube, Pencil, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { EditExerciseDialog } from './EditExerciseDialog';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { extractYouTubeVideoId, isYouTubeShort, getYouTubeEmbedUrl } from '@/lib/utils';

interface Exercise {
  id: string;
  libelle: string;
  description?: string;
  categories: string[];
  groupes: string[];
  niveau?: string;
  materiel: string[];
  video_provider: string;
  video_id?: string;
  youtube_url?: string;
  verified: boolean;
  created_by?: string;
}

interface ExerciseLibraryProps {
  onSelectExercise?: (exercise: Exercise) => void;
  selectionMode?: boolean;
}

export const ExerciseLibrary: React.FC<ExerciseLibraryProps> = ({
  onSelectExercise,
  selectionMode = false
}) => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGroupe, setSelectedGroupe] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [deletingExercise, setDeletingExercise] = useState<Exercise | null>(null);

  // New exercise form state
  const [newExercise, setNewExercise] = useState({
    libelle: '',
    description: '',
    youtube_url: '',
    categories: [] as string[],
    groupes: [] as string[],
    niveau: '',
    materiel: [] as string[]
  });

  const CATEGORIES = [
    'Cardio', 'Musculation', 'Étirements', 'Mobilité', 'HIIT', 
    'Yoga', 'Pilates', 'Fonctionnel', 'Isométrique'
  ];

  const GROUPES = [
    'Pectoraux', 'Dos', 'Épaules', 'Biceps', 'Triceps', 'Abdos',
    'Quadriceps', 'Ischio-jambiers', 'Mollets', 'Fessiers', 'Corps entier'
  ];

  const NIVEAUX = ['Débutant', 'Intermédiaire', 'Avancé'];
  
  const MATERIEL = [
    'Aucun', 'Haltères', 'Barre', 'Élastiques', 'Kettlebell', 
    'Medecine ball', 'Banc', 'Pull-up bar', 'TRX'
  ];

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    filterExercises();
  }, [exercises, searchTerm, selectedCategory, selectedGroupe]);

  const fetchExercises = async () => {
    try {
      const records = await pb.collection('exercises').getFullList({ sort: 'libelle' });
      setExercises(records as unknown as Exercise[]);
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de charger les exercices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterExercises = () => {
    let filtered = exercises;

    if (searchTerm) {
      filtered = filtered.filter(ex => 
        ex.libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(ex => ex.categories.includes(selectedCategory));
    }

    if (selectedGroupe !== 'all') {
      filtered = filtered.filter(ex => ex.groupes.includes(selectedGroupe));
    }

    setFilteredExercises(filtered);
  };

  const handleAddExercise = async () => {
    if (!newExercise.libelle || !user) return;

    try {
      const record = await pb.collection('exercises').create({
        libelle: newExercise.libelle,
        description: newExercise.description,
        youtube_url: newExercise.youtube_url,
        video_id: extractYouTubeVideoId(newExercise.youtube_url),
        categories: newExercise.categories,
        groupes: newExercise.groupes,
        niveau: newExercise.niveau,
        materiel: newExercise.materiel,
        verified: false,
        created_by: user?.id,
      });
      setExercises(prev => [record as unknown as Exercise, ...prev]);

      setShowAddDialog(false);
      setNewExercise({
        libelle: '',
        description: '',
        youtube_url: '',
        categories: [],
        groupes: [],
        niveau: '',
        materiel: []
      });

      toast({
        title: "Exercice ajouté",
        description: "L'exercice a été ajouté à la banque",
      });

    } catch {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'exercice",
        variant: "destructive",
      });
    }
  };

  const toggleArrayItem = (array: string[], item: string, setter: (arr: string[]) => void) => {
    if (array.includes(item)) {
      setter(array.filter(i => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  const handleDeleteExercise = async () => {
    if (!deletingExercise) return;

    try {
      await pb.collection('exercises').delete(deletingExercise.id);

      setExercises(prev => prev.filter(ex => ex.id !== deletingExercise.id));
      toast({
        title: "Exercice supprimé",
        description: "L'exercice a été supprimé de la banque",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'exercice",
        variant: "destructive",
      });
    } finally {
      setDeletingExercise(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-3/4 mb-4"></div>
              <div className="flex space-x-2">
                <div className="h-6 bg-muted rounded w-16"></div>
                <div className="h-6 bg-muted rounded w-20"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with search and filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Banque d'exercices</h2>
          {user?.role === 'coach' && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter exercice
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nouvel exercice</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="libelle">Nom de l'exercice *</Label>
                    <Input
                      id="libelle"
                      value={newExercise.libelle}
                      onChange={(e) => setNewExercise(prev => ({ ...prev, libelle: e.target.value }))}
                      placeholder="Ex: Pompes diamant"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newExercise.description}
                      onChange={(e) => setNewExercise(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Description détaillée de l'exercice..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="youtube_url">URL YouTube (non répertoriée)</Label>
                    <Input
                      id="youtube_url"
                      value={newExercise.youtube_url}
                      onChange={(e) => setNewExercise(prev => ({ ...prev, youtube_url: e.target.value }))}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>

                  <div>
                    <Label>Catégories</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {CATEGORIES.map(cat => (
                        <Badge
                          key={cat}
                          variant={newExercise.categories.includes(cat) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleArrayItem(
                            newExercise.categories, 
                            cat, 
                            (arr) => setNewExercise(prev => ({ ...prev, categories: arr }))
                          )}
                        >
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Groupes musculaires</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {GROUPES.map(groupe => (
                        <Badge
                          key={groupe}
                          variant={newExercise.groupes.includes(groupe) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleArrayItem(
                            newExercise.groupes, 
                            groupe, 
                            (arr) => setNewExercise(prev => ({ ...prev, groupes: arr }))
                          )}
                        >
                          {groupe}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Niveau</Label>
                      <Select
                        value={newExercise.niveau}
                        onValueChange={(value) => setNewExercise(prev => ({ ...prev, niveau: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner niveau" />
                        </SelectTrigger>
                        <SelectContent>
                          {NIVEAUX.map(niveau => (
                            <SelectItem key={niveau} value={niveau}>{niveau}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Matériel</Label>
                      <div className="flex flex-wrap gap-1 mt-2 max-h-20 overflow-y-auto">
                        {MATERIEL.map(mat => (
                          <Badge
                            key={mat}
                            variant={newExercise.materiel.includes(mat) ? "default" : "outline"}
                            className="cursor-pointer text-xs"
                            onClick={() => toggleArrayItem(
                              newExercise.materiel, 
                              mat, 
                              (arr) => setNewExercise(prev => ({ ...prev, materiel: arr }))
                            )}
                          >
                            {mat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleAddExercise} disabled={!newExercise.libelle}>
                      Ajouter exercice
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un exercice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex space-x-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedGroupe} onValueChange={setSelectedGroupe}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous groupes</SelectItem>
                {GROUPES.map(groupe => (
                  <SelectItem key={groupe} value={groupe}>{groupe}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          {filteredExercises.length} exercice(s) trouvé(s)
        </div>
      </div>

      {/* Exercises Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredExercises.map(exercise => (
          <Card key={exercise.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg leading-tight">{exercise.libelle}</CardTitle>
                {exercise.video_id && (
                  <Badge variant="outline" className="ml-2 shrink-0">
                    <Youtube className="h-3 w-3 mr-1" />
                    Vidéo
                  </Badge>
                )}
              </div>
              
              {exercise.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {exercise.description}
                </p>
              )}
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Categories and Groups */}
              <div className="flex flex-wrap gap-1">
                {exercise.categories.slice(0, 2).map(cat => (
                  <Badge key={cat} variant="secondary" className="text-xs">
                    {cat}
                  </Badge>
                ))}
                {exercise.groupes.slice(0, 2).map(groupe => (
                  <Badge key={groupe} variant="outline" className="text-xs">
                    {groupe}
                  </Badge>
                ))}
                {(exercise.categories.length + exercise.groupes.length) > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{(exercise.categories.length + exercise.groupes.length) - 4}
                  </Badge>
                )}
              </div>

              {/* Level and Material */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{exercise.niveau || 'Tous niveaux'}</span>
                <span>{exercise.materiel.join(', ') || 'Aucun'}</span>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                {selectionMode ? (
                  <Button
                    onClick={() => onSelectExercise?.(exercise)}
                    className="flex-1"
                    size="sm"
                  >
                    Sélectionner
                  </Button>
                ) : (
                  <>
                    {exercise.video_id && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Play className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>{exercise.libelle}</DialogTitle>
                          </DialogHeader>
                          <div className={isYouTubeShort(exercise.youtube_url || '') ? "flex justify-center" : "aspect-video"}>
                            <iframe
                              src={getYouTubeEmbedUrl(exercise.video_id, isYouTubeShort(exercise.youtube_url || ''))}
                              title={exercise.libelle}
                              className={isYouTubeShort(exercise.youtube_url || '') ? "w-full max-w-[360px] h-[640px] rounded-lg" : "w-full h-full rounded-lg"}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                          {exercise.description && (
                            <p className="text-sm text-muted-foreground">
                              {exercise.description}
                            </p>
                          )}
                        </DialogContent>
                      </Dialog>
                    )}
                    
                    {user?.role === 'coach' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingExercise(exercise)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingExercise(exercise)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">Aucun exercice trouvé</h3>
            <p className="text-sm text-muted-foreground">
              Essayez de modifier vos filtres ou votre recherche.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Exercise Dialog */}
      {editingExercise && (
        <EditExerciseDialog
          open={!!editingExercise}
          onOpenChange={(open) => !open && setEditingExercise(null)}
          exercise={editingExercise}
          onSuccess={fetchExercises}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingExercise} onOpenChange={(open) => !open && setDeletingExercise(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'exercice "{deletingExercise?.libelle}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExercise} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
