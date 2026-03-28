"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { aiChat, type ChatMessage } from "@/actions/ai";
import { createNote, updateNote, deleteNote } from "@/actions/notes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Loader2,
  Wand2,
  StickyNote,
  Send,
  Plus,
  Trash2,
  Save,
  PanelRightClose,
  PanelRightOpen,
  MessageSquare,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NoteData {
  id: string;
  title: string;
  content: string;
  updatedAt: Date;
}

interface AISidebarProps {
  resourceId: string;
  title: string;
  type: string;
  initialNotes: NoteData[];
  tags: string[];
}

const quickActions = [
  { label: "Summarize this", prompt: "Can you summarize the key points of this resource?" },
  { label: "Explain simply", prompt: "Can you explain this topic in simple terms with examples?" },
  { label: "Quiz me", prompt: "Generate 5 multiple-choice questions to test my understanding of this topic." },
  { label: "Key takeaways", prompt: "What are the most important takeaways I should remember?" },
];

export function AISidebar({ resourceId, title, type, initialNotes, tags }: AISidebarProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "notes">("chat");
  const [collapsed, setCollapsed] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatPending, startChatTransition] = useTransition();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // Notes state
  const [notesList, setNotesList] = useState<NoteData[]>(initialNotes);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(initialNotes[0]?.id ?? null);
  const [noteContent, setNoteContent] = useState(initialNotes[0]?.content ?? "");
  const [noteTitle, setNoteTitle] = useState(initialNotes[0]?.title ?? "");
  const [noteSaved, setNoteSaved] = useState(true);
  const [isNotePending, startNoteTransition] = useTransition();

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  function sendMessage(content: string) {
    if (!content.trim() || isChatPending) return;
    const userMsg: ChatMessage = { role: "user", content: content.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setChatInput("");

    startChatTransition(async () => {
      const response = await aiChat(newMessages, { resourceTitle: title, resourceType: type, tags });
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    });
  }

  function handleChatKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(chatInput);
    }
  }

  function selectNote(note: NoteData) {
    setActiveNoteId(note.id);
    setNoteContent(note.content);
    setNoteTitle(note.title);
    setNoteSaved(true);
  }

  function handleCreateNote() {
    startNoteTransition(async () => {
      const created = await createNote(resourceId, `Note ${notesList.length + 1}`);
      const newNote = { id: created.id, title: created.title, content: created.content, updatedAt: created.updatedAt };
      setNotesList((prev) => [newNote, ...prev]);
      selectNote(newNote);
    });
  }

  function handleSaveNote() {
    if (!activeNoteId) return;
    startNoteTransition(async () => {
      await updateNote(activeNoteId, { title: noteTitle, content: noteContent });
      setNotesList((prev) =>
        prev.map((n) => (n.id === activeNoteId ? { ...n, title: noteTitle, content: noteContent, updatedAt: new Date() } : n))
      );
      setNoteSaved(true);
    });
  }

  function handleDeleteNote() {
    if (!activeNoteId) return;
    startNoteTransition(async () => {
      await deleteNote(activeNoteId);
      const remaining = notesList.filter((n) => n.id !== activeNoteId);
      setNotesList(remaining);
      if (remaining.length > 0) {
        selectNote(remaining[0]);
      } else {
        setActiveNoteId(null);
        setNoteContent("");
        setNoteTitle("");
      }
    });
  }

  if (collapsed) {
    return (
      <div className="sticky top-0 h-screen w-12 shrink-0 border-l border-border/60 bg-sidebar flex flex-col items-center py-4 gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(false)}
          className="rounded-xl h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <PanelRightOpen className="w-4 h-4" />
        </Button>
        <div className="h-px w-6 bg-border" />
        <button onClick={() => { setCollapsed(false); setActiveTab("chat"); }} className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
          <MessageSquare className="w-3.5 h-3.5 text-primary" />
        </button>
        <button onClick={() => { setCollapsed(false); setActiveTab("notes"); }} className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors">
          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div className="sticky top-0 h-screen w-[380px] shrink-0 border-l border-border/60 bg-sidebar flex flex-col overflow-hidden">
      {/* Header with tabs */}
      <div className="shrink-0 border-b border-border/60">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wand2 className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold">Study Tools</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(true)}
            className="rounded-xl h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <PanelRightClose className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex px-4 gap-1 pb-2">
          <button
            onClick={() => setActiveTab("chat")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              activeTab === "chat"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            AI Chat
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              activeTab === "notes"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            Notes
            {notesList.length > 0 && (
              <span className={cn(
                "ml-0.5 text-[10px] px-1.5 rounded-full",
                activeTab === "notes" ? "bg-primary-foreground/20" : "bg-muted-foreground/20"
              )}>
                {notesList.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "chat" ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center gap-4 pt-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">AI Study Assistant</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                    Ask me anything about &ldquo;{title}&rdquo;
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full mt-2">
                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => sendMessage(action.prompt)}
                      disabled={isChatPending}
                      className="text-left p-2.5 rounded-xl border border-border/60 bg-card hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-[11px] font-medium leading-tight">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-2.5", msg.role === "user" ? "justify-end" : "justify-start")}>
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-3.5 py-2.5 max-w-[85%] text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted/60 border border-border/40 rounded-bl-md"
                  )}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}

            {isChatPending && (
              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3 h-3 text-primary" />
                </div>
                <div className="rounded-2xl rounded-bl-md bg-muted/60 border border-border/40 px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="shrink-0 border-t border-border/60 p-3">
            <div className="flex items-end gap-2">
              <Textarea
                ref={chatInputRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyDown}
                placeholder="Ask about this resource..."
                className="min-h-[40px] max-h-[120px] resize-none text-sm rounded-xl"
                rows={1}
              />
              <Button
                size="icon"
                onClick={() => sendMessage(chatInput)}
                disabled={!chatInput.trim() || isChatPending}
                className="rounded-xl h-10 w-10 shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Notes list header */}
          <div className="shrink-0 p-3 border-b border-border/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                {notesList.length} {notesList.length === 1 ? "note" : "notes"}
              </span>
              <Button onClick={handleCreateNote} disabled={isNotePending} variant="ghost" size="sm" className="h-7 text-xs rounded-lg">
                <Plus className="w-3 h-3" />
                New Note
              </Button>
            </div>
            {notesList.length > 0 && (
              <div className="flex gap-1 overflow-x-auto pb-1">
                {notesList.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => selectNote(note)}
                    className={cn(
                      "shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all max-w-[140px] truncate",
                      activeNoteId === note.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {note.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Note editor */}
          {activeNoteId ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-3 space-y-2 flex-1 overflow-y-auto">
                <Input
                  value={noteTitle}
                  onChange={(e) => { setNoteTitle(e.target.value); setNoteSaved(false); }}
                  placeholder="Note title..."
                  className="h-8 text-sm font-medium border-0 bg-transparent px-0 focus-visible:ring-0 shadow-none"
                />
                <Textarea
                  value={noteContent}
                  onChange={(e) => { setNoteContent(e.target.value); setNoteSaved(false); }}
                  placeholder="Start writing..."
                  className="flex-1 min-h-[300px] resize-none text-sm border-0 bg-transparent px-0 focus-visible:ring-0 shadow-none"
                />
              </div>
              <div className="shrink-0 border-t border-border/60 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">
                    {noteSaved ? "Saved" : "Unsaved"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button onClick={handleDeleteNote} disabled={isNotePending} variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                  <Button onClick={handleSaveNote} disabled={isNotePending || noteSaved} size="sm" className="h-7 rounded-lg text-xs">
                    {isNotePending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Save
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-muted-foreground">
              <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center">
                <StickyNote className="w-6 h-6" />
              </div>
              <p className="text-xs text-center">No notes yet. Create one to start taking notes on this resource.</p>
              <Button onClick={handleCreateNote} disabled={isNotePending} size="sm" className="rounded-xl">
                <Plus className="w-3.5 h-3.5" />
                Create Note
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
