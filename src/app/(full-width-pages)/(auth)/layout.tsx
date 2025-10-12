import { ThemeProvider } from "@/context/ThemeContext";
import Link from "next/link";
import React from "react";

const ContactInfo = () => (
  <div className="mt-8 space-y-4 text-white">
    <div className="flex items-start space-x-3">
      <svg className="w-5 h-5 mt-0.5 text-brand-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span>Jl. Tuanku Tambusai, Bagan Besar, Kec. Bukit Kapur, Kota Dumai, Riau 28826</span>
    </div>
    <div className="flex items-center space-x-3">
      <svg className="w-5 h-5 text-brand-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
      <a href="tel:(0765)810322" className="hover:underline">(0765) 810322</a>
    </div>
    <div className="flex items-center space-x-3">
      <svg className="w-5 h-5 text-brand-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Senin - Jumat: 08:00 - 16:00</span>
    </div>
  </div>
);

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-900">
      <ThemeProvider>
        <div className="flex flex-col lg:flex-row w-full min-h-screen">
          {/* Left side - Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
            <div className="w-full max-w-md">
              {children}
            </div>
          </div>

          {/* Right side - Info */}
          <div className="w-full lg:w-1/2 bg-brand-900 text-white p-8 lg:p-12 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full">
              <Link href="/" className="block mb-8 text-center">
                <div className="inline-block w-24 h-24 bg-white rounded-full p-3 shadow-lg">
                  <div className="w-full h-full rounded-full border-4 border-brand-400 flex items-center justify-center">
                    <span className="text-2xl font-bold text-brand-700">KPU</span>
                  </div>
                </div>
                <h1 className="mt-4 text-3xl font-bold">KPU Kota Dumai</h1>
                <p className="text-brand-200">Sistem Aset Digital</p>
              </Link>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Fitur Sistem</h2>
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-brand-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Manajemen Aset Digital Terintegrasi</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-brand-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Sistem Keamanan Berlapis</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-brand-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Interface User-Friendly</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-brand-800">
                  <ContactInfo />
                </div>
              </div>

              <div className="mt-8 text-sm text-brand-300 text-center">
                © {new Date().getFullYear()} KPU Kota Dumai. Sistem Aset Digital.
              </div>
            </div>
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}
