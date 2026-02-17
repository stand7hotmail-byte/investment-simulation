"use client";

import { usePortfolios } from "@/hooks/usePortfolios";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ArrowRightIcon } from "@radix-ui/react-icons";

export default function PortfoliosPage() {
  const { data: portfolios, isLoading, isError, error } = usePortfolios();

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto py-8">
        <h1 className="text-3xl font-bold">My Portfolios</h1>
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
      <div className="space-y-4 max-w-5xl mx-auto py-8">
        <h1 className="text-3xl font-bold">My Portfolios</h1>
        <p className="text-red-500">Error loading portfolios: {error?.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto py-8">
      <h1 className="text-3xl font-bold">My Portfolios</h1>
      {portfolios && portfolios.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolios.map((portfolio) => (
            <Card key={portfolio.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{portfolio.name}</CardTitle>
                <CardDescription>{portfolio.description || "No description provided."}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/portfolios/${portfolio.id}`} className="flex items-center text-blue-600 hover:underline">
                  View Details <ArrowRightIcon className="ml-1 h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No portfolios found. Create one to get started!</p>
      )}
    </div>
  );
}
