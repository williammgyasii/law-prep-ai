import { db } from "@/db";
import { studyPlans } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { formatDate } from "@/lib/utils";
import { getSessionUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Sparkles } from "lucide-react";
import { StudyPlanForm } from "@/components/study/study-plan-form";
import { EmptyState } from "@/components/shared/empty-state";
import { DeletePlanButton } from "@/components/study/delete-plan-button";

async function getPlans() {
  const user = await getSessionUser();
  return db.query.studyPlans.findMany({
    where: eq(studyPlans.userId, user.id!),
    orderBy: [desc(studyPlans.createdAt)],
  });
}

export default async function PlannerPage() {
  const plans = await getPlans();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Study Planner</h2>
        <p className="text-muted-foreground mt-1">
          Generate AI-powered study plans tailored to your schedule.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StudyPlanForm />

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Your Plans</h3>
          {plans.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No plans yet"
              description="Generate your first study plan to get started."
              className="py-10"
            />
          ) : (
            plans.map((plan) => {
              const prefs = plan.preferences as { availableDays?: string[]; minutesPerDay?: number } | null;
              return (
                <Card key={plan.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          {plan.title}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Created {formatDate(plan.createdAt)}
                          {plan.examDate && ` · Exam: ${formatDate(plan.examDate)}`}
                        </CardDescription>
                      </div>
                      <DeletePlanButton planId={plan.id} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {prefs?.availableDays && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {prefs.availableDays.map((day) => (
                          <Badge key={day} variant="secondary" className="text-xs">
                            {day}
                          </Badge>
                        ))}
                        {prefs.minutesPerDay && (
                          <Badge variant="outline" className="text-xs">
                            {prefs.minutesPerDay} min/day
                          </Badge>
                        )}
                      </div>
                    )}
                    <div className="rounded-lg bg-muted/50 border p-4">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {typeof plan.generatedPlan === "string"
                          ? plan.generatedPlan
                          : JSON.stringify(plan.generatedPlan, null, 2)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
