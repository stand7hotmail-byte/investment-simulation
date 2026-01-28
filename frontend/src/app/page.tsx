import { AssetSelector } from "@/components/simulation/AssetSelector";

export default function Home() {
  return (
    <div className="max-w-md">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Simulation Setup</h1>
      <div className="space-y-6">
        <p className="text-slate-500">
          Select the assets you want to include in your efficiency analysis.
        </p>
        <AssetSelector />
      </div>
    </div>
  );
}
