"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Repeat,
  Heart,
  Target,
  BarChart3,
  CalendarCheck,
  Menu,
  Zap,
  Calendar,
  ListTodo,
  Trophy,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useState } from "react";
import { signOut } from "@/lib/services/auth-service";
import { useToast } from "@/components/ui/use-toast";

function LogoutButton() {
  const { toast } = useToast();
  
  const handleLogout = async () => {
    try {
      await signOut();
      toast({ title: "Logged out", description: "You have been successfully logged out." });
      window.location.href = '/login';
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleLogout} title="Log Out" className="text-muted-foreground hover:text-destructive">
      <LogOut className="h-[18px] w-[18px]" />
      <span className="sr-only">Log Out</span>
    </Button>
  );
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/planner", label: "Planner", icon: Calendar },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/routines", label: "Routines", icon: ListTodo },
  { href: "/habits", label: "Habits", icon: Repeat },
  { href: "/health", label: "Health", icon: Heart },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/records", label: "Records", icon: Trophy },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/review", label: "Review", icon: CalendarCheck },
];

function NavContent({ pathname, onNavClick }: { pathname: string; onNavClick?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarHeader() {
  return (
    <div className="flex items-center gap-2.5 px-6 py-5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
        <Zap className="h-[18px] w-[18px] text-primary-foreground" />
      </div>
      <div>
        <h1 className="text-base font-bold tracking-tight">LifeOS</h1>
        <p className="text-[11px] text-muted-foreground leading-none">Tracker</p>
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-50 border-r bg-card/50 backdrop-blur-xl">
      <SidebarHeader />
      <Separator className="mx-3" />
      <div className="flex-1 overflow-y-auto py-4">
        <NavContent pathname={pathname} />
      </div>
      <Separator className="mx-3" />
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-1">
          <NotificationBell />
          <ThemeToggle />
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}

export function MobileHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Top 4 critical tabs for bottom bar
  const bottomNavItems = navItems.slice(0, 4);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur-xl px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <span className="font-bold font-heading tracking-tight">LifeOS</span>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <ThemeToggle />
        </div>
      </header>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border/40 bg-background/90 backdrop-blur-2xl pb-safe pt-2 px-2 lg:hidden">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 w-16 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-6 w-6", isActive ? "fill-primary/20" : "")} />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
        
        {/* Menu Sheet Trigger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger 
            render={
              <button className="flex flex-col items-center justify-center gap-1 p-2 w-16 text-muted-foreground hover:text-foreground transition-colors outline-none cursor-pointer" />
            }
          >
              <Menu className="h-6 w-6" />
              <span className="text-[10px] font-medium leading-none">Menu</span>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl p-0 h-[80vh] flex flex-col bg-background/95 backdrop-blur-2xl">
            <SheetTitle className="sr-only">More Options</SheetTitle>
            <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-muted" />
            <div className="p-6">
              <SidebarHeader />
            </div>
            <Separator />
            <div className="flex-1 overflow-y-auto p-4">
              <NavContent pathname={pathname} onNavClick={() => setOpen(false)} />
            </div>
            <Separator />
            <div className="p-4 flex justify-between items-center bg-muted/20">
              <LogoutButton />
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </>
  );
}
