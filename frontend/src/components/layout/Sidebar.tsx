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
  UserPlus,
  ChevronLeft,
  ChevronRight,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/useUIStore";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Efficient Frontier", href: "/simulation/efficient-frontier", icon: TrendingUp },
  { name: "Accumulation Sim", href: "/simulation/accumulation", icon: LineChart },
  { name: "Portfolios", href: "/portfolios", icon: Wallet },
  { name: "Simulation History", href: "/simulation/history", icon: History },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const { sidebarCollapsed, toggleSidebar, hasHydrated } = useUIStore();

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

  // Prevent flash of collapsed state before hydration
  if (!hasHydrated) {
    return <div className="flex h-full w-64 flex-col bg-white border-r border-border" />;
  }

  return (
    <div className={cn(
      "flex h-full flex-col bg-white border-r border-border transition-all duration-300 relative",
      sidebarCollapsed ? "w-16" : "w-64"
    )}>
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon-xs"
        className="absolute -right-3 top-6 h-6 w-6 rounded-full border bg-white shadow-sm hover:bg-slate-50 z-50"
        onClick={toggleSidebar}
      >
        {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {/* Brand Logo */}
      <div className={cn(
        "flex h-16 items-center px-4",
        sidebarCollapsed ? "justify-center" : "px-6"
      )}>
        <span className={cn(
          "font-bold tracking-tight text-primary transition-all duration-300",
          sidebarCollapsed ? "text-lg" : "text-xl"
        )}>
          {sidebarCollapsed ? "IS" : "InvestSim"}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary/5 text-primary" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                sidebarCollapsed && "justify-center px-2"
              )}
              title={sidebarCollapsed ? item.name : ""}
            >
              <item.icon className={cn(
                "h-5 w-5 flex-shrink-0",
                !sidebarCollapsed && "mr-3"
              )} />
              {!sidebarCollapsed && <span>{item.name}</span>}
              {isActive && !sidebarCollapsed && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="border-t border-border p-2 space-y-1">
        {user ? (
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <div className="px-3 py-2 text-xs font-medium text-slate-400 truncate">
                {user.email}
              </div>
            )}
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start text-slate-500 hover:text-slate-900 hover:bg-slate-50 p-2 h-auto",
                sidebarCollapsed && "justify-center"
              )}
              onClick={handleSignOut}
              title={sidebarCollapsed ? "Sign Out" : ""}
            >
              <LogOut className={cn("h-5 w-5", !sidebarCollapsed && "mr-3")} />
              {!sidebarCollapsed && <span>Sign Out</span>}
            </Button>
          </div>
        ) : (
          <>
            <Link
              href="/login"
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                sidebarCollapsed && "justify-center"
              )}
              title={sidebarCollapsed ? "Login" : ""}
            >
              <LogIn className={cn("h-5 w-5", !sidebarCollapsed && "mr-3")} />
              {!sidebarCollapsed && <span>Login</span>}
            </Link>
            <Link
              href="/signup"
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                sidebarCollapsed && "justify-center"
              )}
              title={sidebarCollapsed ? "Sign Up" : ""}
            >
              <UserPlus className={cn("h-5 w-5", !sidebarCollapsed && "mr-3")} />
              {!sidebarCollapsed && <span>Sign Up</span>}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
