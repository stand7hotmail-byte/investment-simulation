"use client";

import React, { useEffect, useRef } from 'react';
import { useSimulationStore } from '@/store/useSimulationStore';
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useI18n } from '@/hooks/useI18n';

interface CustomAllocationInputProps {
  selectedAssetCodes: string[];
  onCalculateCustom: () => void;
  isCalculatingCustom: boolean;
}

export const CustomAllocationInput: React.FC<CustomAllocationInputProps> = ({ 
  selectedAssetCodes, 
  onCalculateCustom, 
  isCalculatingCustom 
}) => {
  const { customAllocations, setCustomAllocation } = useSimulationStore();
  const { t } = useI18n();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize with equal weights if not set
  useEffect(() => {
    if (selectedAssetCodes.length > 0) {
      const currentKeys = Object.keys(customAllocations);
      const hasAllKeys = selectedAssetCodes.every(code => currentKeys.includes(code));
      
      if (!hasAllKeys) {
        const initialWeight = 100 / selectedAssetCodes.length;
        selectedAssetCodes.forEach(code => {
          setCustomAllocation(code, initialWeight);
        });
      }
    }
  }, [selectedAssetCodes, customAllocations, setCustomAllocation]);

  const triggerCalculation = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onCalculateCustom();
    }, 500); // 500ms debounce
  };

  const handleSliderChange = (code: string, newValue: number) => {
    const oldValue = customAllocations[code] || 0;
    const diff = newValue - oldValue;

    if (selectedAssetCodes.length === 1) {
      setCustomAllocation(code, 100);
      triggerCalculation();
      return;
    }

    const otherCodes = selectedAssetCodes.filter(c => c !== code);
    const totalOtherOldValue = otherCodes.reduce((sum, c) => sum + (customAllocations[c] || 0), 0);

    setCustomAllocation(code, newValue);

    otherCodes.forEach(otherCode => {
      const otherOldValue = customAllocations[otherCode] || 0;
      let otherNewValue = 0;
      
      if (totalOtherOldValue === 0) {
        otherNewValue = (100 - newValue) / otherCodes.length;
      } else {
        otherNewValue = otherOldValue - (diff * (otherOldValue / totalOtherOldValue));
      }
      
      setCustomAllocation(otherCode, Math.max(0, otherNewValue));
    });

    triggerCalculation();
  };

  if (selectedAssetCodes.length === 0) return null;

  return (
    <div className="border rounded-md p-6 bg-slate-50/50 mt-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-800">Custom Portfolio Allocation</h3>
        {isCalculatingCustom && <span className="text-sm font-medium text-primary animate-pulse">Calculating...</span>}
      </div>
      <div className="space-y-6">
        {selectedAssetCodes.map((code) => {
          const val = customAllocations[code] || 0;
          return (
            <div key={code} className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-slate-700">{code}</Label>
                <span className="text-sm font-mono font-medium text-slate-900">{val.toFixed(1)}%</span>
              </div>
              <Slider
                value={[val]}
                min={0}
                max={100}
                step={0.1}
                onValueChange={(vals) => handleSliderChange(code, vals[0])}
                className="w-full"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
