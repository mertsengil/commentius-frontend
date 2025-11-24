import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Commentius - Kurumsal İşletmeler İçin Yorum Yönetim Sistemi",
  description:
    "Commentius, işletmelerin müşteri geri bildirimlerini etkili bir şekilde yönetmelerine yardımcı olan bir platformdur. Müşteri yorumlarını toplayın, analiz edin ve iyileştirin.",
  icons: {
    icon: "/images/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <Providers>
          <Toaster position="top-center" richColors />
          {children}
        </Providers>
      </body>
    </html>
  );
}
