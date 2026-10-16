import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MarketingLayout from "@/components/layout/MarketingLayout";
import { ToastProvider } from "@/components/ui/Toast";
import { ConfirmProvider } from "@/components/ui/ConfirmDialog";
import { AppSettingsProvider, settingsInitScript } from "@/components/providers/AppSettings";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

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
    "Orbitrix ERP delivers custom management software for restaurants, clinics, book shops, schools, gyms, car rentals, real estate, and salons. Cloud-based, scalable, and built for Pakistan's growing businesses.",
  keywords: [
    "restaurant management software",
    "clinic management system",
    "school management software",
    "book shop management",
    "gym management software",
    "car rental management system",
    "real estate management software",
    "salon management software",
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
      "Custom management software for restaurants, clinics, book shops, schools, gyms, car rentals, real estate, and salons.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Orbitrix ERP — Smart Management Software",
    description: "Custom software for restaurants, clinics, book shops, schools, gyms, car rentals, real estate, and salons.",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#15757b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: settingsInitScript }} />
      </head>
      <body className="min-h-screen flex flex-col antialiased" suppressHydrationWarning>
        <AppSettingsProvider>
          <ToastProvider>
            <ConfirmProvider>
              <MarketingLayout>{children}</MarketingLayout>
            </ConfirmProvider>
          </ToastProvider>
        </AppSettingsProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
