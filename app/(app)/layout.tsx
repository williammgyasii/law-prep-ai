import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/top-bar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { auth } from "@/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <TooltipProvider>
      <div className="flex h-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen overflow-auto">
          <TopBar userName={session?.user?.name} userImage={session?.user?.image} />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
