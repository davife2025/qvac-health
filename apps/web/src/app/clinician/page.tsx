export default function ClinicianPage() {
  return (
    <main className="min-h-full p-6 max-w-2xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">SOAP Note Generator</h1>
        <p className="text-gray-500 text-sm">
          Paste session notes → get structured SOAP documentation. All local.
        </p>
      </header>

      {/* Placeholder — full implementation in Session 5 */}
      <div className="card text-center py-16 text-gray-400">
        <p className="text-4xl mb-4">🩺</p>
        <p className="font-medium">SOAP generator coming in Session 5</p>
        <p className="text-sm mt-1">QVAC MedPsy LLM + structured output</p>
      </div>
    </main>
  );
}
