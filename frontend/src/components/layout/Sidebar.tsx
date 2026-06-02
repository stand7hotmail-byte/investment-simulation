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
  History,
  Languages
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/useUIStore";
import { useI18n } from "@/hooks/useI18n";

const navigationItems = [
  { id: 'dashboard', name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { id: 'efficient_frontier', name: "Efficient Frontier", href: "/simulation/efficient-frontier", icon: TrendingUp },
  { id: 'accumulation_sim', name: "Accumulation Sim", href: "/simulation/accumulation", icon: LineChart },
  { id: 'portfolios', name: "Portfolios", href: "/portfolios", icon: Wallet },
  { id: 'history', name: "Simulation History", href: "/simulation/history", icon: History },
  { id: 'settings', name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const { sidebarCollapsed, toggleSidebar, hasHydrated } = useUIStore();
  const { lang, t } = useI18n();

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
    router.push(`/${lang}`);
    router.refresh();
  };

  const toggleLanguage = () => {
    const newLang = lang === 'en' ? 'ja' : 'en';
    // Set cookie
    document.cookie = `NEXT_LOCALE=${newLang};path=/;max-age=31536000`;
    
    // Replace current lang in pathname
    const segments = pathname.split('/');
    if (segments[1] === lang) {
      segments[1] = newLang;
      router.push(segments.join('/'));
    } else {
      router.push(`/${newLang}${pathname}`);
    }
  };

  // Prevent flash of collapsed state before hydration
  if (!hasHydrated) {
    return <div className="flex h-full w-64 flex-col bg-white border-r border-border" />;
  }

  return (
    <div className={cn(
      "flex h-full flex-col glass-sidebar transition-all duration-300 relative z-40",
      sidebarCollapsed ? "w-16" : "w-64"
    )}>
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon-xs"
        className="absolute -right-3 top-6 h-6 w-6 rounded-full border bg-background/80 backdrop-blur-md shadow-md hover:bg-accent hover:text-accent-foreground hover:scale-105 transition-all z-50"
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
          "font-extrabold tracking-wider bg-gradient-to-r from-primary via-chart-4 to-chart-1 bg-clip-text text-transparent transition-all duration-300 drop-shadow-sm",
          sidebarCollapsed ? "text-lg" : "text-2xl"
        )}>
          {sidebarCollapsed ? "IS" : "InvestSim"}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigationItems.map((item) => {
          const localizedHref = `/${lang}${item.href}`;
          const isActive = pathname === localizedHref;
          return (
            <Link
              key={item.id}
              href={localizedHref}
              className={cn(
                "group flex items-center rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 relative overflow-hidden",
                isActive 
                  ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary shadow-[inset_3px_0_0_var(--color-primary)]" 
                  : "text-muted-foreground hover:bg-accent/40 hover:text-accent-foreground hover:translate-x-1",
                sidebarCollapsed && "justify-center px-2 hover:translate-x-0"
              )}
              title={sidebarCollapsed ? t(`nav.${item.id}`) : ""}
            >
              <item.icon className={cn(
                "h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-accent-foreground",
                !sidebarCollapsed && "mr-3"
              )} />
              {!sidebarCollapsed && <span>{t(`nav.${item.id}`)}</span>}
              {isActive && !sidebarCollapsed && (
                <div className="ml-auto h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)] animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="border-t border-border/60 p-2 space-y-1">
        {/* Language Switcher */}
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent/40 rounded-lg p-2.5 h-auto transition-all",
            sidebarCollapsed && "justify-center"
          )}
          onClick={toggleLanguage}
          title={sidebarCollapsed ? (lang === 'en' ? '日本語' : 'English') : ""}
        >
          <Languages className={cn("h-5 w-5", !sidebarCollapsed && "mr-3")} />
          {!sidebarCollapsed && <span>{lang === 'en' ? '日本語' : 'English'}</span>}
        </Button>

        {user ? (
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground truncate">
                {user.email}
              </div>
            )}
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg p-2.5 h-auto transition-all",
                sidebarCollapsed && "justify-center"
              )}
              onClick={handleSignOut}
              title={sidebarCollapsed ? t('common.signOut') : ""}
            >
              <LogOut className={cn("h-5 w-5", !sidebarCollapsed && "mr-3")} />
              {!sidebarCollapsed && <span>{t('common.signOut')}</span>}
            </Button>
          </div>
        ) : (
          <>
            <Link
              href={`/${lang}/login`}
              className={cn(
                "flex items-center rounded-lg px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-accent/40 hover:text-foreground transition-all",
                sidebarCollapsed && "justify-center"
              )}
              title={sidebarCollapsed ? t('landing.login') : ""}
            >
              <LogIn className={cn("h-5 w-5", !sidebarCollapsed && "mr-3")} />
              {!sidebarCollapsed && <span>{t('landing.login')}</span>}
            </Link>
            <Link
              href={`/${lang}/signup`}
              className={cn(
                "flex items-center rounded-lg px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-accent/40 hover:text-foreground transition-all",
                sidebarCollapsed && "justify-center"
              )}
              title={sidebarCollapsed ? t('auth.signupButton') : ""}
            >
              <UserPlus className={cn("h-5 w-5", !sidebarCollapsed && "mr-3")} />
              {!sidebarCollapsed && <span>{t('auth.signupButton')}</span>}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
