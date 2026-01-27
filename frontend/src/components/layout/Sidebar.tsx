"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LineChart, 
  TrendingUp, 
  Settings, 
  LayoutDashboard,
  Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Efficient Frontier", href: "/simulation/efficient-frontier", icon: TrendingUp },
  { name: "Monte Carlo", href: "/simulation/monte-carlo", icon: LineChart },
  { name: "Portfolios", href: "/portfolios", icon: Wallet },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-white">
      <div className="flex h-16 items-center px-6">
        <span className="text-xl font-bold tracking-tight">InvestSim</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive 
                  ? "bg-slate-800 text-white" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
