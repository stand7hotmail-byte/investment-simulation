"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LineChart, 
  TrendingUp, 
  Settings, 
  LayoutDashboard,
  Wallet,
  LogOut,
  LogIn,
  UserPlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Efficient Frontier", href: "/simulation/efficient-frontier", icon: TrendingUp },
  { name: "Accumulation Sim", href: "/simulation/accumulation", icon: LineChart },
  { name: "Portfolios", href: "/portfolios", icon: Wallet },
  { name: "Simulation History", href: "/simulation/history", icon: LineChart },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-white">
      <div className="flex h-16 items-center px-6">
        <span className="text-xl font-bold tracking-tight text-blue-400">InvestSim</span>
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
                  ? "bg-slate-800 text-white border-l-2 border-blue-500" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4 space-y-2">
        {user ? (
          <div className="space-y-3">
            <div className="px-3 py-2 text-xs font-medium text-slate-500 truncate">
              {user.email}
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800 p-2 h-auto"
              onClick={handleSignOut}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        ) : (
          <>
            <Link
              href="/login"
              className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <LogIn className="mr-3 h-5 w-5" />
              Login
            </Link>
            <Link
              href="/signup"
              className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <UserPlus className="mr-3 h-5 w-5" />
              Sign Up
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
