import ResultsClient from "./ResultsClient";
import ProtectedRoute from "@/components/ProtectedRoute";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return (
    <ProtectedRoute>
      <ResultsClient id={id} />
    </ProtectedRoute>
  );
}
