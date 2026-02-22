// frontend/src/components/simulation/CustomAllocationInput.tsx
import React from 'react';
import { useSimulationStore } from '@/store/useSimulationStore';
import { Button } from "@/components/ui/button"; // New import

interface CustomAllocationInputProps {
  selectedAssetCodes: string[];
  onCalculateCustom: () => void; // New prop for button click handler
  isCalculatingCustom: boolean; // New prop for loading state
}

export const CustomAllocationInput: React.FC<CustomAllocationInputProps> = ({ 
  selectedAssetCodes, 
  onCalculateCustom, 
  isCalculatingCustom 
}) => {
  const { customAllocations, setCustomAllocation } = useSimulationStore();

  const totalWeight = selectedAssetCodes.reduce((sum, code) => {
    return sum + (customAllocations[code] || 0);
  }, 0);

  const handleChange = (code: string, value: string) => {
    const weight = parseFloat(value);
    if (!isNaN(weight) && weight >= 0 && weight <= 100) {
      setCustomAllocation(code, weight);
    } else if (value === '') { // Allow clearing the input field
      setCustomAllocation(code, 0); // Or remove it completely from customAllocations
    }
  };

  return (
    <div className="border rounded-md p-4">
      <h3 className="text-lg font-font-semibold mb-3">Custom Portfolio Allocation</h3>
      {selectedAssetCodes.length === 0 ? (
        <p className="text-sm text-gray-500">Select assets first to set custom allocations.</p>
      ) : (
        <div className="space-y-2">
          {selectedAssetCodes.map((code) => (
            <div key={code} className="flex items-center justify-between">
              <label htmlFor={`allocation-${code}`} className="text-sm font-medium w-1/2">
                {code}
              </label>
              <input
                id={`allocation-${code}`}
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="0.0"
                className="w-1/2 px-2 py-1 border rounded-md text-sm"
                value={customAllocations[code] || ''} // Display value from store
                onChange={(e) => handleChange(code, e.target.value)}
              />
              <span className="ml-2">%</span>
            </div>
          ))}
          <div 
            className={`border-t pt-2 mt-2 flex justify-between items-center font-semibold ${
              totalWeight > 100.01 || totalWeight < 99.99 ? 'text-red-500' : 'text-green-600'
            }`}
          >
            <span>Total:</span>
            <span>{totalWeight.toFixed(1)}%</span>
          </div>
          {totalWeight > 100.01 && <p className="text-xs text-red-500">Total allocation exceeds 100%.</p>}
          {totalWeight < 99.99 && selectedAssetCodes.length > 0 && <p className="text-xs text-orange-500">Total allocation is less than 100%.</p>}
          <Button
            className="w-full h-10 text-base font-medium shadow-sm transition-all active:scale-[0.98] mt-4"
            onClick={onCalculateCustom}
            disabled={selectedAssetCodes.length === 0 || isCalculatingCustom || totalWeight < 99.9 || totalWeight > 100.1}
          >
            {isCalculatingCustom ? "Calculating..." : "Calculate Custom Portfolio"}
          </Button>
        </div>
      )}
    </div>
  );
};
