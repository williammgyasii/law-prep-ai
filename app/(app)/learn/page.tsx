import { getUserDocuments, getDocumentLimits } from "@/actions/learn";
import { DocumentLibrary } from "@/components/learn/document-library";

export default async function LearnPage() {
  const [docs, limits] = await Promise.all([
    getUserDocuments(),
    getDocumentLimits(),
  ]);

  return (
    <DocumentLibrary
      initialDocuments={docs}
      limits={limits}
    />
  );
}
