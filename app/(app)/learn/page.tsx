import { Suspense } from "react";
import { getUserDocuments, getDocumentLimits } from "@/actions/learn";
import { LearnWorkspace } from "@/components/learn/learn-workspace";

export default async function LearnPage() {
  const [docs, limits] = await Promise.all([
    getUserDocuments(),
    getDocumentLimits(),
  ]);

  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Loading workspace...</div>}>
      <LearnWorkspace
        initialDocuments={docs}
        limits={limits}
      />
    </Suspense>
  );
}
