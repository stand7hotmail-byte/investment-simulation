import React from 'react';
import { usePortfolios } from '@/hooks/usePortfolios';
import { useSimulationStore } from '@/store/useSimulationStore'; // Assuming this manages selected comparison portfolios
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Portfolio } from '@/types/portfolio'; // Assuming this type is defined

interface ComparisonPortfolioSelectorProps {
  // Props will be defined later if needed
}

export const ComparisonPortfolioSelector: React.FC<ComparisonPortfolioSelectorProps> = () => {
  const { data: portfolios, isLoading, error } = usePortfolios();
  const { selectedComparisonPortfolioIds, toggleComparisonPortfolio } = useSimulationStore(); // Assuming these actions exist

  if (isLoading) {
    return (
      <Card className="w-full shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Compare Portfolios</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading portfolios...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Compare Portfolios</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error loading portfolios: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Compare Portfolios</CardTitle>
      </CardHeader>
      <CardContent>
        {portfolios && portfolios.length > 0 ? (
          <ScrollArea className="h-[200px] w-full rounded-md border p-4">
            <div className="space-y-2">
              {portfolios.map((portfolio: Portfolio) => ( // Assuming Portfolio type
                <div key={portfolio.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`compare-portfolio-${portfolio.id}`}
                    checked={selectedComparisonPortfolioIds.includes(portfolio.id)}
                    onCheckedChange={() => toggleComparisonPortfolio(portfolio.id)}
                  />
                  <label
                    htmlFor={`compare-portfolio-${portfolio.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {portfolio.name}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-sm text-gray-500">No saved portfolios to compare.</p>
        )}
      </CardContent>
    </Card>
  );
};