"use client";

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { fetchApi } from '@/lib/api';
import { Portfolio, CreatePortfolioRequest } from '@/types/portfolio';
import { useAssets } from '@/hooks/useAssets';
import { usePortfolio } from '@/hooks/usePortfolios';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2 } from 'lucide-react';

const allocationSchema = z.object({
  asset_code: z.string().min(1, 'Asset is required'),
  weight: z.number().min(0).max(100),
});

const formSchema = z.object({
  name: z.string().min(1, 'Portfolio name is required'),
  description: z.string().optional(),
  allocations: z.array(allocationSchema).min(1, 'At least one asset is required'),
}).refine((data) => {
  const totalWeight = data.allocations.reduce((sum, item) => sum + item.weight, 0);
  return Math.abs(totalWeight - 100) < 0.0001;
}, {
  message: 'Total weight must be exactly 100%',
  path: ['allocations'],
});

type FormValues = z.infer<typeof formSchema>;

export default function EditPortfolioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: assets, isLoading: assetsLoading } = useAssets();
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolio(id);

  const {
    register,
    control,
    handleSubmit,
    reset,
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

  useEffect(() => {
    if (portfolio) {
      reset({
        name: portfolio.name,
        description: portfolio.description || '',
        allocations: portfolio.allocations?.map(a => ({
          asset_code: a.asset_code,
          weight: Number(a.weight),
        })) || [],
      });
    }
  }, [portfolio, reset]);

  const updatePortfolioMutation = useMutation<Portfolio, Error, CreatePortfolioRequest>({
    mutationFn: (updatedData) =>
      fetchApi<Portfolio>(`/api/portfolios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['portfolios', id] });
      toast.success('Portfolio updated successfully!');
      router.push('/portfolios');
    },
    onError: (error) => {
      toast.error(`Failed to update portfolio: ${error.message}`);
    },
  });

  const onSubmit = (data: FormValues) => {
    updatePortfolioMutation.mutate({
      name: data.name,
      description: data.description || null,
      allocations: data.allocations,
    });
  };

  const totalWeight = watch('allocations')?.reduce((sum, item) => sum + (Number(item.weight) || 0), 0) || 0;

  if (portfolioLoading || assetsLoading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold">Portfolio not found</h2>
        <Button onClick={() => router.push('/portfolios')} variant="link" className="mt-4">
          Go back to portfolios
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="portfolioName">Portfolio Name</Label>
              <Input
                id="portfolioName"
                {...register('name')}
                placeholder="e.g. Retirement Fund"
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Describe your investment strategy..."
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Asset Allocations</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ asset_code: '', weight: 0 })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Asset
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-4 items-start">
                  <div className="flex-1 space-y-1">
                    <select
                      {...register(`allocations.${index}.asset_code`)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select an asset...</option>
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
                      placeholder="Weight"
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
                <span className="text-sm font-medium">Total Weight:</span>
                <span className={`text-sm font-bold ${Math.abs(totalWeight - 100) < 0.0001 ? 'text-green-600' : 'text-destructive'}`}>
                  {totalWeight.toFixed(1)}%
                </span>
              </div>
            </div>

            <CardFooter className="flex justify-end p-0 pt-4 gap-4">
              <Button type="button" variant="ghost" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || updatePortfolioMutation.isPending}>
                {updatePortfolioMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
