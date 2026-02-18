import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TrendingUp, LineChart, Wallet } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AssetHistoricalChart } from "@/components/charts/AssetHistoricalChart";

export default function Home() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome to InvestSim</h1>
        <p className="text-slate-500 text-lg">
          Your professional tool for investment portfolio analysis and simulation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <TrendingUp className="h-8 w-8 text-blue-600 mb-2" />
            <CardTitle>Efficient Frontier</CardTitle>
            <CardDescription>
              Find the optimal asset allocation to maximize returns for a given risk level.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/simulation/efficient-frontier">Go to Analysis</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow opacity-60">
          <CardHeader>
            <LineChart className="h-8 w-8 text-indigo-600 mb-2" />
            <CardTitle>Monte Carlo</CardTitle>
            <CardDescription>
              Predict future portfolio values using probabilistic forecasting models.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full cursor-not-allowed">
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow opacity-60">
          <CardHeader>
            <Wallet className="h-8 w-8 text-emerald-600 mb-2" />
            <CardTitle>My Portfolios</CardTitle>
            <CardDescription>
              Manage your saved portfolios and track your historical performance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full cursor-not-allowed">
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
      <div className="mt-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-4">SPY Historical Price</h2>
        <AssetHistoricalChart assetCode="SPY" />
      </div>
    </div>
  );
}