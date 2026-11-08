// Placeholder for sections that still live in the Laravel app.
export function NotPorted({ title, laravelFiles }: { title: string; laravelFiles: string[] }) {
  return (
    <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm">
      <h1 className="mb-2 text-xl font-semibold text-gray-800">{title}</h1>
      <p className="text-gray-600">هذا القسم لم يُنقل بعد إلى Next.js.</p>
      <p className="mt-4 text-sm text-gray-500" dir="ltr">
        Port from: {laravelFiles.join(", ")}
      </p>
    </div>
  );
}
