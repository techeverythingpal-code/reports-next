import Image from "next/image";

// Guest layout: centered card, like Laravel's guest.blade.php.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <Image src="/images/logo.png" alt="" width={72} height={98} priority style={{ height: "auto" }} />
        </div>
        {children}
      </div>
    </main>
  );
}
