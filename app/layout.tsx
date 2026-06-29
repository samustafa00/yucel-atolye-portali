import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SCHOOL_LOGO_PATH, SCHOOL_NAME } from "@/lib/constants";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: `${SCHOOL_NAME} | Atölye Portalı`,
  description: `${SCHOOL_NAME} atölyeleri için öğrenci, öğretmen, veli ve admin yönetim portalı.`,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
    shortcut: SCHOOL_LOGO_PATH
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#18202f"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
