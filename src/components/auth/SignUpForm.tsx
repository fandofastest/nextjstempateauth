"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

type RegisterData = {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'customer';
};

type ButtonProps = {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

const CustomButton: React.FC<ButtonProps> = ({ 
  children, 
  className = '', 
  disabled = false,
  onClick
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type="submit"
      className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};

export default function SignUpForm() {
  const router = useRouter();
  const { register } = useAuth();
  
  // Handle registration with individual parameters
  const handleRegister = async (name: string, email: string, password: string, phone: string) => {
    if (register) {
      // Call register with individual parameters instead of an object
      return register(name, email, password, phone);
    }
    throw new Error('Register function is not available');
  };
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    agree: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    if (!formData.agree) {
      setError('Anda harus menyetujui syarat dan ketentuan');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await handleRegister(
        formData.name,
        formData.email,
        formData.password,
        formData.phone
      );
      
      // Redirect ke halaman user setelah pendaftaran berhasil
      router.push('/user');
      
      // Show success message
      if (typeof window !== 'undefined') {
        window.alert('Pendaftaran berhasil! Selamat datang di Malay Futsal');
      }
    } catch (err) {
      console.error('Pendaftaran gagal:', err);
      setError('Email sudah terdaftar atau terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="col-span-2">
          <Label htmlFor="name">Nama Lengkap</Label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="Masukkan nama lengkap"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 text-sm border rounded-lg border-stroke bg-transparent outline-none focus:border-primary focus-visible:shadow-none dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="email">Email</Label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="contoh@email.com"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 text-sm border rounded-lg border-stroke bg-transparent outline-none focus:border-primary focus-visible:shadow-none dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="phone">Nomor HP</Label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="0812-3456-7890"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 text-sm border rounded-lg border-stroke bg-transparent outline-none focus:border-primary focus-visible:shadow-none dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimal 8 karakter"
              value={formData.password}
              onChange={handleChange}
              minLength={8}
              required
              className="w-full px-4 py-3 text-sm border rounded-lg border-stroke bg-transparent outline-none focus:border-primary focus-visible:shadow-none dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              {showPassword ? <EyeCloseIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="Ketik ulang password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 text-sm border rounded-lg border-stroke bg-transparent outline-none focus:border-primary focus-visible:shadow-none dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
          />
        </div>
      </div>

      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="agree"
            name="agree"
            type="checkbox"
            checked={formData.agree}
            onChange={handleChange}
            required
            className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <label htmlFor="agree" className="ml-2 text-sm text-gray-600 dark:text-gray-300">
          Saya menyetujui{' '}
          <Link href="/terms" className="text-brand-600 hover:underline dark:text-brand-400">
            Syarat & Ketentuan
          </Link>{' '}
          dan{' '}
          <Link href="/privacy" className="text-brand-600 hover:underline dark:text-brand-400">
            Kebijakan Privasi
          </Link>
        </label>
      </div>

      <div className="pt-2">
        <CustomButton
          className="w-full px-4 py-3 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 focus:ring-4 focus:outline-none focus:ring-brand-300 dark:bg-brand-600 dark:hover:bg-brand-700 dark:focus:ring-brand-800"
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
        </CustomButton>
      </div>
    </form>
  );
}
