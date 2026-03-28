"use client";

import { useState, useTransition } from "react";
import { saveNote } from "@/actions/notes";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";

interface NoteEditorProps {
  resourceId: string;
  initialContent: string;
}

export function NoteEditor({ resourceId, initialContent }: NoteEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [saved, setSaved] = useState(true);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await saveNote(resourceId, content);
      setSaved(true);
    });
  }

  return (
    <div className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setSaved(false);
        }}
        placeholder="Write your study notes here..."
        className="min-h-[200px] resize-y"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {saved ? "All changes saved" : "Unsaved changes"}
        </span>
        <Button onClick={handleSave} disabled={isPending || saved} size="sm">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Notes
        </Button>
      </div>
    </div>
  );
}
