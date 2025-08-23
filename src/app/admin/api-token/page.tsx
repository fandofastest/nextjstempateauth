"use client";
import React, { useEffect, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";

export default function ApiTokenPage() {
  const [token, setToken] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // Read token stored by authService.login. If not present, try to issue from session.
    const bootstrap = async () => {
      if (typeof window === "undefined") return;
      const existing = localStorage.getItem("token") || "";
      if (existing) {
        setToken(existing);
        return;
      }
      // Try to get a token from current authenticated session (NextAuth or Bearer cookie)
      await issueToken();
    };
    bootstrap();
  }, []);

  const issueToken = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/auth/token", { method: "POST" });
      if (!res.ok) {
        if (res.status === 401) {
          setError("Belum login. Silakan login terlebih dahulu.");
        } else {
          const data = await res.json().catch(() => ({} as any));
          setError(data?.message || "Gagal membuat token");
        }
        return;
      }
      const data = (await res.json()) as { token: string };
      if (data?.token) {
        setToken(data.token);
        if (typeof window !== "undefined") {
          localStorage.setItem("token", data.token);
        }
      }
    } catch (e: any) {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageBreadcrumb pageTitle="API Token" />
      </div>

      <div className="space-y-6">
        <ComponentCard title="Token Akses API">
          <div className="space-y-3">
            <p className="text-theme-sm text-gray-600 dark:text-gray-400">
              Simpan dan gunakan token ini sebagai Authorization: Bearer untuk memanggil API Anda. Jangan bagikan token ini ke siapa pun.
            </p>

            <div className="flex items-center gap-3">
              <input
                readOnly
                value={token || "(belum ada token)"}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
              />
              <Button
                size="sm"
                variant="outline"
                disabled={!token}
                onClick={handleCopy}
                className={copied ? "border-green-500 text-green-600 dark:text-green-400" : undefined}
              >
                {copied ? "Disalin" : "Salin"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={issueToken}
                disabled={loading}
                className={loading ? "opacity-70" : undefined}
              >
                {loading ? "Membuat..." : token ? "Buat Ulang" : "Buat Token"}
              </Button>
            </div>

            {error && (
              <p className="text-theme-xs text-amber-600 dark:text-amber-400">
                {error}
              </p>
            )}
          </div>
        </ComponentCard>
        <ComponentCard title="Files API">
          <div className="space-y-6 text-theme-sm">
            <section className="space-y-2">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Daftar File</h3>
              <p className="text-gray-700 dark:text-gray-300">Ambil list file. Admin melihat semua, user hanya miliknya.</p>
              <pre className="p-3 rounded bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100 overflow-auto"><code>{`GET /api/files?page=1&pageSize=20&q=invoice
Authorization: Bearer <JWT>

200 OK
{
  "files": [
    {
      "_id": "...",
      "originalName": "dokumen.pdf",
      "storedName": "1755692724940_720ecf4b2b65.pdf",
      "size": 123456,
      "mimeType": "application/pdf",
      "storagePath": "...",
      "uploader": "<userId>",
      "isPublic": false,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 42
}`}</code></pre>
              <pre className="p-3 rounded bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100 overflow-auto"><code>{`# cURL list files
curl -s "http://localhost:3000/api/files?page=1&pageSize=20&q=invoice" \
  -H "Authorization: Bearer $TOKEN"`}</code></pre>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Upload File</h3>
              <p className="text-gray-700 dark:text-gray-300">Gunakan multipart/form-data field <code>file</code>. Batas ukuran mengikuti env <code>NEXT_PUBLIC_UPLOAD_MAX_SIZE_MB</code> / <code>UPLOAD_MAX_SIZE_MB</code>.</p>
              <pre className="p-3 rounded bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100 overflow-auto"><code>{`POST /api/files
Authorization: Bearer <JWT>
Content-Type: multipart/form-data

Form-Data:
- file: <binary>

201 Created
{
  "file": {
    "_id": "...",
    "originalName": "dokumen.pdf",
    "storedName": "1755692724940_720ecf4b2b65.pdf",
    "size": 123456,
    "mimeType": "application/pdf",
    "storagePath": "...",
    "uploader": "<userId>",
    "isPublic": false,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}`}</code></pre>
              <pre className="p-3 rounded bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100 overflow-auto"><code>{`# cURL upload
curl -s -X POST http://localhost:3000/api/files \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./dokumen.pdf"`}</code></pre>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Metadata File</h3>
              <p className="text-gray-700 dark:text-gray-300">Ambil metadata per file. Admin bisa semua, user hanya miliknya.</p>
              <pre className="p-3 rounded bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100 overflow-auto"><code>{`GET /api/files/{id}
Authorization: Bearer <JWT>

200 OK
{
  "file": {
    "_id": "...",
    "originalName": "dokumen.pdf",
    "storedName": "1755692724940_720ecf4b2b65.pdf",
    "size": 123456,
    "mimeType": "application/pdf",
    "storagePath": "...",
    "uploader": "<userId>",
    "isPublic": false,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}`}</code></pre>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Download File</h3>
              <p className="text-gray-700 dark:text-gray-300">Unduh file sebagai attachment. Hanya pemilik atau admin.</p>
              <pre className="p-3 rounded bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100 overflow-auto"><code>{`GET /api/files/{id}/download
Authorization: Bearer <JWT>

200 OK (binary stream)
Headers:
Content-Type: <mime>
Content-Disposition: attachment; filename="<originalName>"`}</code></pre>
              <pre className="p-3 rounded bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100 overflow-auto"><code>{`# cURL download
curl -L -o dokumen.pdf \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/files/{id}/download`}</code></pre>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Hapus File</h3>
              <p className="text-gray-700 dark:text-gray-300">Hapus file (fisik + metadata). Hanya pemilik atau admin.</p>
              <pre className="p-3 rounded bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100 overflow-auto"><code>{`DELETE /api/files/{id}
Authorization: Bearer <JWT>

200 OK
{
  "success": true
}`}</code></pre>
            </section>
          </div>
        </ComponentCard>
        <ComponentCard title="Dokumentasi API">
          <div className="space-y-6 text-theme-sm">
            <section className="space-y-2">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Autentikasi</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                <li><b>POST</b> <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-white/10">/api/auth/login</code> — Login email & password, balikan token</li>
                <li><b>GET</b> <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-white/10">/api/auth/me</code> — Profil user saat ini (perlu Bearer token)</li>
                <li><b>POST</b> <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-white/10">/api/auth/refresh</code> — Perbarui token (sementara re-issue dari token valid)</li>
                <li><b>POST</b> <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-white/10">/api/auth/logout</code> — Logout (client hapus token)</li>
                <li><b>POST</b> <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-white/10">/api/auth/token</code> — Terbitkan token dari session login (NextAuth) atau Bearer</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h4 className="font-medium text-gray-800 dark:text-gray-200">Header</h4>
              <p className="text-gray-700 dark:text-gray-300">Gunakan header berikut untuk endpoint yang memerlukan autentikasi:</p>
              <pre className="p-3 rounded bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100 overflow-auto"><code>{`Authorization: Bearer <TOKEN>`}</code></pre>
            </section>

            <section className="space-y-2">
              <h4 className="font-medium text-gray-800 dark:text-gray-200">1) Login</h4>
              <pre className="p-3 rounded bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100 overflow-auto"><code>{`POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

200 OK
{
  "user": {
    "_id": "...",
    "name": "User",
    "email": "user@example.com",
    "role": "admin",
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "token": "<JWT>"
}`}</code></pre>
            </section>

            <section className="space-y-2">
              <h4 className="font-medium text-gray-800 dark:text-gray-200">2) Profil Saya</h4>
              <pre className="p-3 rounded bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100 overflow-auto"><code>{`GET /api/auth/me
Authorization: Bearer <JWT>

200 OK
{
  "user": {
    "_id": "...",
    "name": "User",
    "email": "user@example.com",
    "role": "admin",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}`}</code></pre>
            </section>

            <section className="space-y-2">
              <h4 className="font-medium text-gray-800 dark:text-gray-200">3) Refresh Token</h4>
              <pre className="p-3 rounded bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100 overflow-auto"><code>{`POST /api/auth/refresh
Authorization: Bearer <JWT>

200 OK
{
  "token": "<JWT-Baru>"
}`}</code></pre>
              <p className="text-xs text-gray-600 dark:text-gray-400">Catatan: saat ini backend akan menerbitkan token baru dari token valid. Ke depan bisa diganti ke skema Refresh Token HttpOnly.</p>
            </section>

            <section className="space-y-2">
              <h4 className="font-medium text-gray-800 dark:text-gray-200">4) Logout</h4>
              <pre className="p-3 rounded bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100 overflow-auto"><code>{`POST /api/auth/logout

200 OK
{
  "message": "Logged out"
}`}</code></pre>
              <p className="text-xs text-gray-600 dark:text-gray-400">Client harus menghapus token dari <code>localStorage</code> setelah logout.</p>
            </section>

            <section className="space-y-2">
              <h4 className="font-medium text-gray-800 dark:text-gray-200">5) Terbitkan Token dari Session</h4>
              <pre className="p-3 rounded bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100 overflow-auto"><code>{`POST /api/auth/token

200 OK
{
  "token": "<JWT>"
}`}</code></pre>
              <p className="text-xs text-gray-600 dark:text-gray-400">Digunakan jika Anda login via NextAuth (cookie session). Sistem akan menerbitkan token API tanpa perlu memasukkan password lagi.</p>
            </section>

            <section className="space-y-2">
              <h4 className="font-medium text-gray-800 dark:text-gray-200">Contoh cURL</h4>
              <pre className="p-3 rounded bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100 overflow-auto"><code>{`# Login
echo '{"email":"user@example.com","password":"password123"}' \
  | curl -s -X POST http://localhost:3000/api/auth/login \
    -H 'Content-Type: application/json' \
    -d @-

# Simpan token ke variabel TOKEN, lalu panggil endpoint proteksi
curl -s http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Refresh token
curl -s -X POST http://localhost:3000/api/auth/refresh \
  -H "Authorization: Bearer $TOKEN"`}</code></pre>
            </section>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
