"use client";

import { useState, useTransition } from "react";
import { createResource, deleteResource } from "@/actions/resources";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Trash2, ExternalLink } from "lucide-react";
import { RESOURCE_TYPES, DIFFICULTIES } from "@/lib/constants";
import { DifficultyBadge, TypeBadge } from "@/components/status-badge";

interface ResourceFormProps {
  modules: { id: string; title: string }[];
  existingResources: {
    id: string;
    title: string;
    type: string;
    difficulty: string;
    moduleId: string;
    module: { title: string };
  }[];
}

export function ResourceForm({ modules, existingResources }: ResourceFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState("lesson");
  const [difficulty, setDifficulty] = useState("medium");
  const [moduleId, setModuleId] = useState(modules[0]?.id || "");
  const [estimatedMinutes, setEstimatedMinutes] = useState("30");
  const [tagsInput, setTagsInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterModule, setFilterModule] = useState<string>("all");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    startTransition(async () => {
      await createResource({
        title,
        description,
        url,
        type: type as "video" | "lesson" | "drill" | "practice_test" | "article",
        difficulty: difficulty as "easy" | "medium" | "hard",
        moduleId,
        estimatedMinutes: Number(estimatedMinutes),
        tags,
      });
      setTitle("");
      setDescription("");
      setUrl("");
      setTagsInput("");
      setOpen(false);
    });
  }

  function handleDelete(id: string) {
    setDeletingId(id);
    startTransition(async () => {
      await deleteResource(id);
      setDeletingId(null);
    });
  }

  const filteredResources =
    filterModule === "all"
      ? existingResources
      : existingResources.filter((r) => r.moduleId === filterModule);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Resources</CardTitle>
            <CardDescription>{existingResources.length} total resources</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Resource</DialogTitle>
                <DialogDescription>Add a new learning resource to a module.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Resource title" required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." />
                </div>
                <div className="space-y-2">
                  <Label>External URL</Label>
                  <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." type="url" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RESOURCE_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTIES.map((d) => (
                          <SelectItem key={d.value} value={d.value}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Module</Label>
                  <Select value={moduleId} onValueChange={setModuleId}>
                    <SelectTrigger>
                      <SelectValue />
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
                  <Label>Estimated Minutes</Label>
                  <Input
                    type="number"
                    min={1}
                    max={480}
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tags (comma-separated)</Label>
                  <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="e.g., assumptions, logic, drill" />
                </div>
                <Button type="submit" disabled={isPending || !title || !moduleId} className="w-full">
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add Resource
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Select value={filterModule} onValueChange={setFilterModule}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              {modules.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filteredResources.map((resource) => (
            <div key={resource.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{resource.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <TypeBadge type={resource.type} />
                  <DifficultyBadge difficulty={resource.difficulty} />
                  <Badge variant="secondary" className="text-xs">
                    {resource.module.title}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => handleDelete(resource.id)}
                disabled={deletingId === resource.id}
              >
                {deletingId === resource.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
