"use client";

import { useState } from "react";
import { Play, ExternalLink, MonitorPlay, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LawHubEmbedProps {
  url: string;
  title: string;
  type: string;
}

export function LawHubEmbed({ url, title, type }: LawHubEmbedProps) {
  const [showEmbed, setShowEmbed] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const isVideo = type === "video" || url.includes("/multimedia/");

  if (!showEmbed) {
    return (
      <Card className="border-border/60 overflow-hidden">
        <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
              {isVideo ? (
                <Play className="w-7 h-7 text-white ml-1" />
              ) : (
                <MonitorPlay className="w-7 h-7 text-white" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-sm text-white/60 mt-1">
                {isVideo ? "Video lesson on LawHub" : "Interactive content on LawHub"}
              </p>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <Button
                onClick={() => setShowEmbed(true)}
                className="rounded-xl bg-white text-slate-900 hover:bg-white/90"
              >
                <MonitorPlay className="w-4 h-4" />
                Load in App
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-xl border-white/20 text-white hover:bg-white/10 hover:text-white"
              >
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                  Open on LawHub
                </a>
              </Button>
            </div>
            <p className="text-[11px] text-white/40 mt-1">
              You must be signed in to LawHub to view this content
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card className="border-border/60 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm">Unable to load content in app</p>
              <p className="text-sm text-muted-foreground mt-1">
                LawHub may block embedded viewing. Open the content directly instead.
              </p>
              <div className="flex items-center gap-3 mt-3">
                <Button asChild size="sm" className="rounded-xl">
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open on LawHub
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => {
                    setLoadError(false);
                    setShowEmbed(true);
                  }}
                >
                  Try again
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border/60">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MonitorPlay className="w-3.5 h-3.5" />
          <span>LawHub Content</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-7 text-xs rounded-lg"
          >
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3 h-3" />
              Open in new tab
            </a>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs rounded-lg"
            onClick={() => setShowEmbed(false)}
          >
            Close
          </Button>
        </div>
      </div>
      <div className="relative w-full" style={{ height: "70vh" }}>
        <iframe
          src={url}
          title={title}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; encrypted-media"
          referrerPolicy="no-referrer-when-downgrade"
          onError={() => setLoadError(true)}
        />
      </div>
    </Card>
  );
}
