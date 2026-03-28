import { db } from "@/db";
import { weakAreas, modules } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { AlertTriangle } from "lucide-react";
import { WeakAreaForm } from "@/components/weak-areas/weak-area-form";
import { WeakAreaCard } from "@/components/weak-areas/weak-area-card";
import { EmptyState } from "@/components/shared/empty-state";

async function getData() {
  const sessionUser = await getSessionUser();
  const [userWeakAreas, allModules] = await Promise.all([
    db.query.weakAreas.findMany({
      where: eq(weakAreas.userId, sessionUser.id!),
      with: { module: true },
      orderBy: [asc(weakAreas.confidenceScore)],
    }),
    db
      .select({ id: modules.id, title: modules.title })
      .from(modules)
      .orderBy(asc(modules.order)),
  ]);
  return { weakAreas: userWeakAreas, modules: allModules };
}

export default async function WeakAreasPage() {
  const { weakAreas: userWeakAreas, modules: allModules } = await getData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Weak Areas</h2>
          <p className="text-muted-foreground mt-1">
            Track topics you need to improve and get AI-powered recommendations.
          </p>
        </div>
        <WeakAreaForm modules={allModules} />
      </div>

      {userWeakAreas.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No weak areas tracked"
          description="As you study, add topics here that you find challenging. AI will help you focus your review."
        />
      ) : (
        <div className="space-y-3">
          {userWeakAreas.map((wa) => (
            <WeakAreaCard
              key={wa.id}
              id={wa.id}
              title={wa.title}
              description={wa.description}
              confidenceScore={wa.confidenceScore}
              moduleName={wa.module?.title}
            />
          ))}
        </div>
      )}
    </div>
  );
}
