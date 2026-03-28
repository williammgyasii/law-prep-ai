"use client";

import { useState, useTransition } from "react";
import { createWeakArea } from "@/actions/weak-areas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";

interface WeakAreaFormProps {
  modules: { id: string; title: string }[];
}

export function WeakAreaForm({ modules }: WeakAreaFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [confidence, setConfidence] = useState("2");
  const [moduleId, setModuleId] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await createWeakArea({
        title,
        description,
        confidenceScore: Number(confidence),
        moduleId: moduleId || undefined,
      });
      setTitle("");
      setDescription("");
      setConfidence("2");
      setModuleId("");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4" />
          Add Weak Area
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Track a Weak Area</DialogTitle>
          <DialogDescription>
            Identify topics you need to improve on.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wa-title">Topic</Label>
            <Input
              id="wa-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Sufficient vs Necessary Assumptions"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wa-desc">Description</Label>
            <Textarea
              id="wa-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What specifically are you struggling with?"
            />
          </div>
          <div className="space-y-2">
            <Label>Related Module</Label>
            <Select value={moduleId} onValueChange={setModuleId}>
              <SelectTrigger>
                <SelectValue placeholder="Select module (optional)" />
              </SelectTrigger>
              <SelectContent>
                {modules.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Confidence Level: {confidence}/5</Label>
            <Input
              type="range"
              min={1}
              max={5}
              value={confidence}
              onChange={(e) => setConfidence(e.target.value)}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Very Low</span>
              <span>Very High</span>
            </div>
          </div>
          <Button type="submit" disabled={isPending || !title} className="w-full">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Weak Area
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
