import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Key, Database, Info } from "lucide-react";

export default function SettingsPage() {
  const hasApiKey = !!process.env.OPENAI_API_KEY;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground mt-1">App configuration and status.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="w-4 h-4" />
            Profile
          </CardTitle>
          <CardDescription>Current user information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Name</span>
            <span className="text-sm font-medium">Sarah</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">sarah@example.com</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">User ID</span>
            <code className="text-xs bg-muted px-2 py-1 rounded">user_default</code>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="w-4 h-4" />
            AI Configuration
          </CardTitle>
          <CardDescription>OpenAI API integration status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">OpenAI API Key</span>
            {hasApiKey ? (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Connected</Badge>
            ) : (
              <Badge variant="secondary" className="text-amber-700 bg-amber-50 border-amber-200">
                Using Mock Responses
              </Badge>
            )}
          </div>
          {!hasApiKey && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-sm text-amber-800">
                Add <code className="bg-amber-100 px-1 rounded">OPENAI_API_KEY</code> to your{" "}
                <code className="bg-amber-100 px-1 rounded">.env</code> file to enable real AI responses.
                The app works with mock responses in the meantime.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="w-4 h-4" />
            Database
          </CardTitle>
          <CardDescription>PostgreSQL connection status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Connected</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="w-4 h-4" />
            About
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">App</span>
            <span className="text-sm font-medium">LawPrep AI</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Purpose</span>
            <span className="text-sm">Personal LSAT Study Organizer</span>
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">
            This app helps organize LSAT prep resources into a structured learning experience.
            It does not scrape, copy, or rehost copyrighted LawHub/LSAC content. All content is
            manually curated by the user. AI features use user-authored notes and metadata only.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
