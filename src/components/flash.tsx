// Replaces Laravel's session('success') / session('error') banners.
export function Flash({ success, error }: { success?: string; error?: string }) {
  if (!success && !error) return null;
  return success ? (
    <p role="status" className="mb-4 rounded-lg border border-green-400 bg-green-100 p-4 text-green-700">
      ✅ {success}
    </p>
  ) : (
    <p role="alert" className="mb-4 rounded-lg border border-red-400 bg-red-100 p-4 text-red-700">
      ❌ {error}
    </p>
  );
}
