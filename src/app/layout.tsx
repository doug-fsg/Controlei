import type { Metadata } from "next";
import { Inter } from "next/font/google";
import QueryProvider from "@/components/providers/QueryProvider";
import { SessionProvider } from '@/components/providers/SessionProvider';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema Financeiro",
  description: "Sistema de controle financeiro para entradas e saídas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <QueryProvider>
            <div className="min-h-screen bg-gray-50">
              {children}
            </div>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
