import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MarketingLayout from "@/components/layout/MarketingLayout";
import { ToastProvider } from "@/components/ui/Toast";
import { ConfirmProvider } from "@/components/ui/ConfirmDialog";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Orbitrix ERP — Smart Management Software for Growing Businesses",
    template: "%s | Orbitrix ERP",
  },
  description:
    "Orbitrix ERP delivers custom management software for restaurants, clinics, book shops, and schools. Cloud-based, scalable, and built for Pakistan's growing businesses.",
  keywords: [
    "restaurant management software",
    "clinic management system",
    "school management software",
    "book shop management",
    "SaaS Pakistan",
    "business software",
    "custom software development",
  ],
  authors: [{ name: "Orbitrix ERP" }],
  creator: "Orbitrix ERP",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://orbitrixerp.com",
    siteName: "Orbitrix ERP",
    title: "Orbitrix ERP — Smart Management Software for Growing Businesses",
    description:
      "Custom management software for restaurants, clinics, book shops, and schools.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Orbitrix ERP — Smart Management Software",
    description: "Custom software for restaurants, clinics, book shops, and schools.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col antialiased" suppressHydrationWarning>
        <ToastProvider>
          <ConfirmProvider>
            <MarketingLayout>{children}</MarketingLayout>
          </ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
