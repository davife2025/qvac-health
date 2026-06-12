import { ModelStatusPanel } from "@/components/ModelLoader";

async function getModelStatus() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/models/status`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export default async function ModelsPage() {
  const data = await getModelStatus();

  return (
    <main className="min-h-full p-6 max-w-2xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">AI Models</h1>
        <p className="text-gray-500 text-sm">
          All inference runs locally on your device via QVAC SDK.
        </p>
      </header>

      {data ? (
        <ModelStatusPanel models={data.registry} />
      ) : (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-2xl mb-2">⚠️</p>
          <p className="font-medium">API not reachable</p>
          <p className="text-sm mt-1">
            Make sure the API server is running on port 3001
          </p>
        </div>
      )}

      <div className="card space-y-2">
        <h2 className="font-semibold text-gray-900">Privacy note</h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          Models are downloaded from HuggingFace once and cached locally.
          All inference runs on your device — no data is sent to any server.
          Model files are stored in <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">.qvac-models/</code> and never leave your machine.
        </p>
      </div>
    </main>
  );
}
