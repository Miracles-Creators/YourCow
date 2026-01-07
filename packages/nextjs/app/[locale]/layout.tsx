import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ScaffoldStarkAppWithProviders } from "~~/components/ScaffoldStarkAppWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import { routing } from '~~/lib/i18n/routing';
import "~~/styles/globals.css";

export const metadata: Metadata = {
  title: "YourCow - Invest in Real Cattle Assets",
  description: "Structured liquidity aligned with real production cycles",
  icons: "/logo.ico",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Await params (required in Next.js 15)
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider enableSystem>
            <ScaffoldStarkAppWithProviders>
              {children}
            </ScaffoldStarkAppWithProviders>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
