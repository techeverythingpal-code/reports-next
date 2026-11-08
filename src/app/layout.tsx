import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "نظام التقارير", template: "%s | نظام التقارير" },
  description: "نظام تقارير تقييم المعلمين",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
