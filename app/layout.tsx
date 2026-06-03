import type { Metadata } from "next";
import "./globals.css";

import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

import { getDirection } from "@/i18n/config";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: {
    default: "Dentora — Dental education, done right",
    template: "%s · Dentora",
  },
  description:
    "Bilingual (Arabic & English) online courses built for dental college students.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = getDirection(locale);

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <div className="relative flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
            </div>
            <Toaster
              richColors
              closeButton
              position={dir === "rtl" ? "bottom-left" : "bottom-right"}
            />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
