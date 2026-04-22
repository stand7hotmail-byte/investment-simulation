import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { getDictionary } from "@/lib/i18n";
import { I18nProvider } from "@/hooks/useI18n";
import { headers } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

// Define supported locales
const locales = ["en", "ja"];

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  
  return {
    title: dictionary.common.appName + " - InvestSim",
    description: dictionary.landing.heroSubtitle,
  };
}

export async function generateStaticParams() {
  return locales.map(lang => ({ lang }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://investment-sim-frontend.vercel.app';
  
  // Get current path for hreflang
  const headersList = await headers();
  const fullUrl = headersList.get('x-url') || '';
  const pathname = fullUrl ? new URL(fullUrl).pathname : '';
  // Strip existing lang prefix to avoid duplication
  const purePath = pathname.replace(/^\/(en|ja)/, '') || '/';

  return (
    <html lang={lang}>
      <head>
        {locales.map((l) => (
          <link
            key={l}
            rel="alternate"
            hrefLang={l}
            href={`${baseUrl}/${l}${purePath === '/' ? '' : purePath}`}
          />
        ))}
        <link rel="alternate" hrefLang="x-default" href={`${baseUrl}/en${purePath === '/' ? '' : purePath}`} />
      </head>
      <body className={inter.className}>
        <I18nProvider lang={lang} dictionary={dictionary}>
          <QueryProvider>
            <div className="flex h-screen overflow-hidden bg-background">
              <Sidebar />
              <main className="flex-1 flex flex-col overflow-y-auto">
                <div className="flex-1 p-8">
                  {children}
                </div>
                <Footer />
              </main>
            </div>
          </QueryProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
