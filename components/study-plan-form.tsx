"use client";

import { useState, useTransition } from "react";
import { createStudyPlan } from "@/actions/study-plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Calendar, Sparkles } from "lucide-react";
import { DAYS_OF_WEEK } from "@/lib/constants";

export function StudyPlanForm() {
  const [title, setTitle] = useState("");
  const [examDate, setExamDate] = useState("");
  const [minutesPerDay, setMinutesPerDay] = useState(45);
  const [selectedDays, setSelectedDays] = useState<string[]>(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  const [isPending, startTransition] = useTransition();

  function toggleDay(day: string) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || selectedDays.length === 0) return;

    startTransition(async () => {
      await createStudyPlan({
        title,
        examDate: examDate || undefined,
        availableDays: selectedDays,
        minutesPerDay,
      });
      setTitle("");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Generate Study Plan
        </CardTitle>
        <CardDescription>
          Tell us your availability and we&apos;ll create a personalized study plan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Plan Name</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., March Study Sprint"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="examDate">Exam Date (optional)</Label>
            <Input
              id="examDate"
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="minutes">Minutes per Day: {minutesPerDay}</Label>
            <Input
              id="minutes"
              type="range"
              min={15}
              max={180}
              step={15}
              value={minutesPerDay}
              onChange={(e) => setMinutesPerDay(Number(e.target.value))}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>15 min</span>
              <span>3 hours</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Available Days</Label>
            <div className="grid grid-cols-2 gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <label
                  key={day}
                  className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedDays.includes(day)}
                    onCheckedChange={() => toggleDay(day)}
                  />
                  <span className="text-sm">{day}</span>
                </label>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={isPending || !title || selectedDays.length === 0} className="w-full">
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Plan
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
