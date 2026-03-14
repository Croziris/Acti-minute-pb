import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { User, Users } from 'lucide-react';

type RoleSelection = 'spotif.ve' | 'coach';

const AuthPage = () => {
  const { user, login, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<RoleSelection | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirection si déjà connecté
  useEffect(() => {
    if (user && !isLoading) {
      if (user.role === 'client') {
        window.location.href = '/client/home';
      } else if (user.role === 'coach') {
        window.location.href = '/coach/dashboard';
      }
    }
  }, [user, isLoading]);

  if (user) {
    return user.role === 'client' ?
      <Navigate to="/client/home" replace /> :
      <Navigate to="/coach/dashboard" replace />;
  }

  const handleRoleSelect = (role: RoleSelection) => {
    setSelectedRole(role);
    setEmail('');
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !email.trim() || !password.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const result = await login(email.trim(), password.trim());

    if (result.error) {
      toast({
        title: "Erreur de connexion",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${selectedRole === 'spotif.ve' ? 'Sportif⸱ve' : 'Coach'} !`,
      });
    }
    setIsSubmitting(false);
  };

  const handleBack = () => {
    setSelectedRole(null);
    setEmail('');
    setPassword('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white rounded-xl shadow-lg">
              <img src="/logo-actiminute.png" alt="Acti'Minute" className="h-12 w-12" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Acti'Minute</h1>
          <p className="text-royal-light">Votre coach sportif digital</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {!selectedRole ? 'Qui êtes-vous ?' : `Connexion ${selectedRole === 'spotif.ve' ? 'Sportif⸱ve' : 'Coach'}`}
            </CardTitle>
            <CardDescription>
              {!selectedRole
                ? 'Sélectionnez votre profil pour vous connecter'
                : 'Saisissez vos identifiants pour accéder à votre espace'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedRole ? (
              <div className="space-y-4">
                <Button
                  onClick={() => handleRoleSelect('spotif.ve')}
                  className="w-full h-16 text-left bg-gradient-primary hover:bg-gradient-hero transition-all duration-300"
                  size="lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-semibold">Sportif⸱ve</div>
                      <div className="text-sm opacity-90">Accéder à mon programme</div>
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => handleRoleSelect('coach')}
                  className="w-full h-16 text-left bg-navy hover:bg-grey-800 transition-all duration-300"
                  size="lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-semibold">Coach</div>
                      <div className="text-sm opacity-90">Gérer mes clients</div>
                    </div>
                  </div>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Votre email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Votre mot de passe"
                    required
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1"
                  >
                    Retour
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-primary hover:bg-gradient-hero"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Connexion...' : 'Se connecter'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
