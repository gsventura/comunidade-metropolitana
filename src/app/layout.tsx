import type { Metadata } from "next";
import { Roboto, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

// Configuração da fonte Roboto
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
});

// Mantemos o Geist Mono para código
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Comunidade Metropolitana",
  description: "Aplicativo da Comunidade Metropolitana",
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${roboto.variable} ${geistMono.variable} antialiased bg-zinc-900`}
      >
        <div className="flex flex-col min-h-screen">
          <header className="py-4 flex justify-center items-center border-b border-zinc-800">
            <div className="container max-w-screen-xl mx-auto px-4">
              <div className="flex justify-center">
                <Link href="/">
                  <Image
                    src="/logo.png"
                    alt="Logo da Igreja"
                    width={220}
                    height={75}
                    priority
                  />
                </Link>
              </div>
            </div>
          </header>
          <main className="flex-grow container max-w-screen-xl mx-auto px-4 py-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
