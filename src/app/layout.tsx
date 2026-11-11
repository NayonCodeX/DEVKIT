import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DEVKIT — Build Smarter. Code Better.",
  description:
    "DEVKIT is a professional developer toolkit + AI coding workspace. Code & data tools, secure AI assistant, IndexedDB workspace, and GitHub integration.",
  keywords: [
    "DEVKIT",
    "developer tools",
    "JSON formatter",
    "JWT decoder",
    "UUID generator",
    "AI coding assistant",
    "code workspace",
    "PWA",
  ],
  authors: [{ name: "Nayon Ahamed" }],
  applicationName: "DEVKIT",
  manifest: "/devkit/manifest.json",
  appleWebApp: {
    capable: true,
    title: "DEVKIT",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/devkit/icon-192.png",
    apple: "/devkit/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0f1f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          // Apply persisted theme before paint to avoid FOUC. Reads from localStorage only.
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var raw = localStorage.getItem('devkit-prefs');
                  var theme = 'premium-dark';
                  if (raw) {
                    var parsed = JSON.parse(raw);
                    if (parsed && parsed.state && parsed.state.settings && parsed.state.settings.theme) {
                      theme = parsed.state.settings.theme;
                    }
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {
                  document.documentElement.setAttribute('data-theme', 'premium-dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
