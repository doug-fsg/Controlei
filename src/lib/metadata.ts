import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Sistema Financeiro",
    template: "%s | Sistema Financeiro"
  },
  description: "Sistema de controle financeiro para entradas e saídas - Gerencie suas vendas, despesas e fluxo de caixa de forma simples e eficiente.",
  keywords: ["financeiro", "controle", "vendas", "despesas", "fluxo de caixa", "gestão"],
  authors: [{ name: "Sistema Financeiro" }],
  creator: "Sistema Financeiro",
  publisher: "Sistema Financeiro",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/',
    title: 'Sistema Financeiro',
    description: 'Sistema de controle financeiro para entradas e saídas',
    siteName: 'Sistema Financeiro',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Sistema Financeiro Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sistema Financeiro',
    description: 'Sistema de controle financeiro para entradas e saídas',
    images: ['/logo.png'],
  },
  icons: {
    icon: [
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/icon.png',
    apple: [
      { url: '/icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
};

