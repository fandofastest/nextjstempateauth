import SignUpForm from "@/components/auth/SignUpForm";
import Link from "next/link";
import { Metadata } from "next";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export const metadata: Metadata = {
  title: "Daftar Akun | Malay Futsal",
  description: "Buat akun baru untuk memesan lapangan futsal",
};

export default function SignUp() {
  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
          Daftar Akun Baru
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Daftar untuk mulai memesan lapangan futsal
        </p>
      </div>
      
      <SignUpForm />
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Sudah punya akun?{' '}
          <Link 
            href="/signin" 
            className="font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            Masuk disini
          </Link>
        </p>
      </div>
    </div>
  );
}
