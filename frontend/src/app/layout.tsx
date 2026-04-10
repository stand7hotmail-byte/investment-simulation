import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { QueryProvider } from "@/components/providers/QueryProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "InvestSim - Investment Simulation App",
  description: "Analyze your portfolio with Efficient Frontier and Monte Carlo simulations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
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
      </body>
    </html>
  );
}
