import type { Metadata } from "next";
import "./globals.css";

import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

import { getDirection } from "@/i18n/config";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Toaster } from "@/components/ui/sonner";
import { jsonLdString } from "@/lib/utils";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://dentora-delta.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Why Medicine | Medical education, done right",
    template: "%s · Why Medicine",
  },
  description:
    "Online video courses built for medical school students, taught by practicing clinicians and academics. University curriculum and USMLE Step 1, taught for understanding — not memorization.",
  keywords: [
    "medical education",
    "medical school courses",
    "USMLE Step 1",
    "medicine video lectures",
    "دورات طبية",
    "تعليم طبي",
    "Why Medicine",
  ],
  openGraph: {
    type: "website",
    siteName: "Why Medicine",
    title: "Why Medicine | Medical education, done right",
    description:
      "Online video courses built for medical school students, taught by practicing clinicians and academics.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Why Medicine | Medical education, done right",
    description:
      "Online video courses built for medical school students, taught by practicing clinicians and academics.",
  },
  robots: { index: true, follow: true },
  // Google Search Console ownership token — set GOOGLE_SITE_VERIFICATION in
  // Vercel env and redeploy; the meta tag appears on every page.
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "Why Medicine",
  url: siteUrl,
  logo: `${siteUrl}/why-medicine-mark.png`,
  description:
    "Online video courses built for medical school students, taught by practicing clinicians and academics.",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(organizationJsonLd) }}
        />
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <div className="relative flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
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
