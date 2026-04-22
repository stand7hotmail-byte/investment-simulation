"use client";

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { fetchApi } from '@/lib/api';
import { Portfolio, CreatePortfolioRequest } from '@/types/portfolio';
import { useAssets } from '@/hooks/useAssets';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';

export default function CreatePortfolioPage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: assets, isLoading: assetsLoading } = useAssets();

  const allocationSchema = z.object({
    asset_code: z.string().min(1, t('portfolios.assetRequired')),
    weight: z.number().min(0).max(100),
  });

  const formSchema = z.object({
    name: z.string().min(1, t('portfolios.nameRequired')),
    description: z.string().optional(),
    allocations: z.array(allocationSchema).min(1, t('portfolios.atLeastOneAsset')),
  }).refine((data) => {
    const totalWeight = data.allocations.reduce((sum, item) => sum + item.weight, 0);
    return Math.abs(totalWeight - 100) < 0.0001;
  }, {
    message: t('portfolios.totalWeightError'),
    path: ['allocations'],
  });

  type FormValues = z.infer<typeof formSchema>;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      allocations: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'allocations',
  });

  const createPortfolioMutation = useMutation<Portfolio, Error, CreatePortfolioRequest>({
    mutationFn: (newPortfolioData) =>
      fetchApi<Portfolio>('/api/portfolios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPortfolioData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      toast.success(t('portfolios.createSuccess'));
      router.push(`/${lang}/portfolios`);
    },
    onError: (error) => {
      toast.error(t('portfolios.createError', { message: error.message }));
    },
  });

  const onSubmit = (data: FormValues) => {
    createPortfolioMutation.mutate({
      name: data.name,
      description: data.description || null,
      allocations: data.allocations,
    });
  };

  const totalWeight = watch('allocations')?.reduce((sum, item) => sum + (Number(item.weight) || 0), 0) || 0;

  return (
    <div className="space-y-4 max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>{t('portfolios.createTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="portfolioName">{t('portfolios.nameLabel')}</Label>
              <Input
                id="portfolioName"
                {...register('name')}
                placeholder={t('portfolios.namePlaceholder')}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('portfolios.descriptionLabel')}</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder={t('portfolios.descriptionPlaceholder')}
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>{t('portfolios.allocationsLabel')}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ asset_code: '', weight: 0 })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t('portfolios.addAsset')}
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-4 items-start">
                  <div className="flex-1 space-y-1">
                    <select
                      {...register(`allocations.${index}.asset_code`)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">{t('portfolios.selectAsset')}</option>
                      {assets?.map((asset) => (
                        <option key={asset.asset_code} value={asset.asset_code}>
                          {asset.name} ({asset.asset_code})
                        </option>
                      ))}
                    </select>
                    {errors.allocations?.[index]?.asset_code && (
                      <p className="text-xs text-destructive">{errors.allocations[index].asset_code.message}</p>
                    )}
                  </div>
                  <div className="w-24 space-y-1">
                    <Input
                      type="number"
                      step="0.1"
                      placeholder={t('portfolios.weightPlaceholder')}
                      {...register(`allocations.${index}.weight`, { valueAsNumber: true })}
                    />
                    {errors.allocations?.[index]?.weight && (
                      <p className="text-xs text-destructive">{errors.allocations[index].weight.message}</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="mt-0.5"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}

              {errors.allocations && (
                <p className="text-sm text-destructive">
                  {(errors.allocations as any).message || (errors.allocations as any).root?.message}
                </p>
              )}

              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-medium">{t('portfolios.totalWeight')}</span>
                <span className={`text-sm font-bold ${Math.abs(totalWeight - 100) < 0.0001 ? 'text-green-600' : 'text-destructive'}`}>
                  {totalWeight.toFixed(1)}%
                </span>
              </div>
            </div>

            <CardFooter className="flex justify-end p-0 pt-4 gap-4">
              <Button type="button" variant="ghost" onClick={() => router.back()}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting || createPortfolioMutation.isPending}>
                {createPortfolioMutation.isPending ? t('portfolios.creating') : t('portfolios.createTitle')}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
