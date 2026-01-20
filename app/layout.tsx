import type { Metadata } from "next";
import "./fonts.css";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "./context/ConvexClientProvider";
import { OrganizationProvider } from "./context/OrganizationProvider";
import { CurrentFeedAndThreadProvider } from "./context/CurrentFeedAndThreadProvider";
import { api } from "../convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import { headers } from "next/headers";
import OrganizationLayout from "./components/layout/OrganizationLayout";
import Script from "next/script";

export const metadata: Metadata = {
  title: "churchthreads",
  description: "Your feed",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgSubdomain = (await headers()).get("x-org-host") || "";

  const preloadedOrg = await preloadQuery(
    api.organizations.getOrganizationBySubdomain,
    {
      subdomain: orgSubdomain,
    }
  );

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Gentium+Plus:ital@0;1&family=Lato:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
        <Script id="anchor-positioning-polyfill" strategy="beforeInteractive">{`
        if (!('anchorName' in document.documentElement.style)) {
          window.ANCHOR_POSITIONING_POLYFILL_OPTIONS = {
            excludeInlineStyles: false,
            useAnimationFrame: false,
          };
          import('https://unpkg.com/@oddbird/css-anchor-positioning');
        }
      `}</Script>
      </head>
      <body>
        <ClerkProvider>
          <ConvexClientProvider>
            <OrganizationProvider organization={preloadedOrg}>
              <CurrentFeedAndThreadProvider>
                <OrganizationLayout>{children}</OrganizationLayout>
              </CurrentFeedAndThreadProvider>
            </OrganizationProvider>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
