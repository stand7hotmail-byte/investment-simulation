"use client";

import { usePortfolios } from "@/hooks/usePortfolios";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRightIcon, Plus, Pencil, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import { useI18n } from "@/hooks/useI18n";

export default function PortfoliosPage() {
  const queryClient = useQueryClient();
  const { data: portfolios, isLoading, isError, error } = usePortfolios();
  const { t, lang } = useI18n();

  const deletePortfolioMutation = useMutation({
    mutationFn: (id: string) =>
      fetchApi(`/api/portfolios/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      toast.success(t('portfolios.deleteSuccess'));
    },
    onError: (error: Error) => {
      toast.error(t('portfolios.deleteError', { message: error.message }));
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(t('portfolios.deleteConfirm', { name }))) {
      deletePortfolioMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">{t('portfolios.title')}</h1>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, index) => (
            <Card key={index} data-testid="skeleton-card">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-foreground">{t('portfolios.title')}</h1>
        <p className="text-destructive font-medium">Error loading portfolios: {error?.message}</p>
        <Button onClick={() => window.location.reload()} variant="outline">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">{t('portfolios.title')}</h1>
        <Button asChild>
          <Link href={`/${lang}/portfolios/create`}>
            <Plus className="mr-2 h-4 w-4" />
            {t('portfolios.createButton')}
          </Link>
        </Button>
      </div>

      {portfolios && portfolios.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolios.map((portfolio) => (
            <Card key={portfolio.id} className="hover:shadow-md transition-all flex flex-col h-full">
              <CardHeader className="flex-1">
                <CardTitle className="text-xl">{portfolio.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {portfolio.description || t('portfolios.noDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link 
                  href={`/${lang}/portfolios/${portfolio.id}`} 
                  className="flex items-center text-primary font-medium hover:underline text-sm"
                >
                  {t('portfolios.viewDetails')} <ArrowRightIcon className="ml-1 h-4 w-4" />
                </Link>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-end gap-2 bg-muted/30">
                <Button 
                  asChild 
                  variant="ghost" 
                  size="sm"
                  title={t('portfolios.editTooltip')}
                >
                  <Link href={`/${lang}/portfolios/${portfolio.id}/edit`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(portfolio.id, portfolio.name)}
                  title={t('portfolios.deleteTooltip')}
                  disabled={deletePortfolioMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/20 rounded-xl border-2 border-dashed">
          <p className="text-muted-foreground mb-4">{t('portfolios.noPortfolios')}</p>
          <Button asChild variant="outline">
            <Link href={`/${lang}/portfolios/create`}>
              <Plus className="mr-2 h-4 w-4" />
              {t('portfolios.createFirst')}
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
