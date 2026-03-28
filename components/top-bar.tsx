"use client";

import { usePathname } from "next/navigation";
import { User, Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/modules": "Modules",
  "/planner": "Study Planner",
  "/weak-areas": "Weak Areas",
  "/admin": "Admin",
  "/settings": "Settings",
  "/practice": "Practice",
  "/writing": "LSAT Writing",
  "/lsat-prep": "LSAT Prep Library",
  "/learn": "Learning Hub",
  "/pricing": "Pricing",
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith("/modules/")) return "Module Details";
  if (pathname.startsWith("/resources/")) return "Resource";
  if (pathname.startsWith("/learn/")) return "Document";
  return "LawPrep AI";
}

export function TopBar({ userName, userImage }: { userName?: string | null; userImage?: string | null }) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-between h-14 px-6 w-full">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-foreground">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 text-muted-foreground">
            <Search className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 pl-2 border-l border-border/60">
            {userImage ? (
              <img src={userImage} alt="" className="w-8 h-8 rounded-xl object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
            )}
            <span className="text-sm font-medium hidden sm:block">{userName || "User"}</span>
            <form action="/api/auth/signout" method="POST">
              <Button type="submit" variant="ghost" size="icon" className="rounded-xl h-8 w-8 text-muted-foreground hover:text-destructive">
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
