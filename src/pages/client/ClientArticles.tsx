import React from 'react';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { useQuery } from '@tanstack/react-query';
import { pb } from '@/lib/pocketbase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const ClientArticles = () => {
  const { data: articles, isLoading } = useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      const data = await pb.collection('articles').getFullList({
        sort: '-published_at',
      });
      return data as any[];
    }
  });

  return (
    <ClientLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Articles</h1>
          <p className="text-muted-foreground">
            DÃ©couvrez nos articles et conseils
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !articles || articles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Aucun article disponible pour le moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {articles.map((article) => (
              <Link key={article.id} to={`/client/articles/${article.slug}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    {article.cover_url && (
                      <img 
                        src={article.cover_url} 
                        alt={article.titre || 'Article'} 
                        className="w-full h-48 object-cover rounded-t-lg mb-4"
                      />
                    )}
                    <CardTitle>{article.titre}</CardTitle>
                    {article.excerpt && (
                      <CardDescription>{article.excerpt}</CardDescription>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {article.published_at 
                          ? format(new Date(article.published_at), 'dd MMMM yyyy', { locale: fr })
                          : 'Date inconnue'
                        }
                      </span>
                      {article.author && (
                        <span>â€¢ par {article.author}</span>
                      )}
                    </div>
                    {article.categories && article.categories.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {article.categories.map((cat, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </ClientLayout>
  );
};

export default ClientArticles;


