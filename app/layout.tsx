import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import "maplibre-gl/dist/maplibre-gl.css";
import Sidebar from "@/components/ui/sidebar/Sidebar";
import Navbar from "@/components/ui/navbar/Navbar";
import { Providers } from "@/app/providers";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KrishiMitra - Climate • Soil • Crop Intelligence",
  description: "Enterprise climate and agriculture intelligence platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable, "dark")}
    >
      <body className="min-h-full flex bg-slate-950 text-white overflow-hidden">
        <Providers>
          <Sidebar />
          <main className="flex-1 ml-64 p-6 h-screen overflow-y-auto">
            <Navbar />
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
