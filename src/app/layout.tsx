import { Outfit } from 'next/font/google';
import './globals.css';
import { Metadata } from 'next';

import { ThemeProvider } from '@/context/ThemeContext';
import { SidebarProvider } from '@/context/SidebarContext';
import NextAuthProvider from '../components/NextAuthProvider';

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Sistem Aset Digital KPU Kota Dumai',
  description: 'Sistem manajemen aset digital untuk KPU Kota Dumai',
  keywords: 'KPU, Kota Dumai, aset digital, sistem manajemen',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <NextAuthProvider>
          <ThemeProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
