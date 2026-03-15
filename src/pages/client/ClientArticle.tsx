import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { useQuery } from '@tanstack/react-query';
import { pb } from '@/lib/pocketbase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { NotionRenderer } from '@/components/notion/NotionRenderer';

const ClientArticle = () => {
  const { slug } = useParams();

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['article', slug],
    queryFn: async () => {
      if (!slug) return null;
      const data = await pb.collection('articles').getFirstListItem(`slug = "${slug}"`, {
        requestKey: null,
      });
      return data as any;
    },
    enabled: !!slug
  });

  if (isLoading) {
    return (
      <ClientLayout>
        <div className="space-y-6 max-w-4xl mx-auto">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-96 w-full" />
        </div>
      </ClientLayout>
    );
  }

  if (error || !article) {
    return (
      <ClientLayout>
        <div className="space-y-6 max-w-4xl mx-auto">
          <Link to="/client/articles">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux articles
            </Button>
          </Link>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Article non trouvé ou non disponible.
              </p>
            </CardContent>
          </Card>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <article className="space-y-6 max-w-4xl mx-auto pb-12">
        <Link to="/client/articles">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux articles
          </Button>
        </Link>

        {article.cover_url && (
          <div className="w-full h-64 md:h-96 rounded-lg overflow-hidden">
            <img 
              src={article.cover_url} 
              alt={article.titre || 'Article'} 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold">{article.titre}</h1>
          
          {article.excerpt && (
            <p className="text-lg text-muted-foreground">{article.excerpt}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {article.published_at && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(article.published_at), 'dd MMMM yyyy', { locale: fr })}
                </span>
              </div>
            )}
            
            {article.author && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{article.author}</span>
              </div>
            )}
          </div>

          {article.categories && article.categories.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {article.categories.map((cat, idx) => (
                <span 
                  key={idx}
                  className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}
        </div>

        <Card>
          <CardContent className="pt-6">
            <NotionRenderer blocks={article.blocks || []} />
          </CardContent>
        </Card>
      </article>
    </ClientLayout>
  );
};

export default ClientArticle;


