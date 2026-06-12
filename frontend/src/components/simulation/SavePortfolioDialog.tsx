"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePortfolio } from "@/hooks/useCreatePortfolio";
import { useI18n } from "@/hooks/useI18n";
import { toast } from "sonner";

interface SavePortfolioDialogProps {
  isOpen: boolean;
  onClose: () => void;
  allocations: Record<string, number>;
}

export function SavePortfolioDialog({ isOpen, onClose, allocations }: SavePortfolioDialogProps) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { mutate: createPortfolio, isPending } = useCreatePortfolio();

  const handleSave = () => {
    if (!name.trim()) {
      toast.error(t('common.error') + ": Portfolio name is required");
      return;
    }

    const allocationList = Object.entries(allocations)
      .filter(([_, weight]) => weight > 0)
      .map(([code, weight]) => ({
        asset_code: code,
        weight: weight / 100, // Convert percentage to decimal
      }));

    if (allocationList.length === 0) {
      toast.error(t('common.error') + ": No allocations to save");
      return;
    }

    createPortfolio(
      {
        name: name.trim(),
        description: description.trim() || null,
        allocations: allocationList,
      },
      {
        onSuccess: () => {
          toast.success("Portfolio saved successfully to My Portfolios!");
          setName("");
          setDescription("");
          onClose();
        },
        onError: (error) => {
          toast.error(`Failed to save portfolio: ${error.message}`);
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save to My Portfolios</DialogTitle>
          <DialogDescription>
            Save your custom portfolio allocation to view and manage it later.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Portfolio Name</Label>
            <Input
              id="name"
              placeholder="e.g., Aggressive Growth"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="A brief description of this portfolio's strategy..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="mt-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-md">
            <p className="font-medium text-slate-700 mb-1">Allocations to be saved:</p>
            <ul className="list-disc pl-4 space-y-1">
              {Object.entries(allocations)
                .filter(([_, weight]) => weight > 0)
                .map(([code, weight]) => (
                  <li key={code}>
                    {code}: {weight.toFixed(1)}%
                  </li>
                ))}
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? t('common.loading') : "Save Portfolio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
