# Akademika Web

Dashboard web **Akademika** (SIAKAD) — React + TypeScript + Vite + Tailwind 4 + Zustand, mengikuti arsitektur loka-kasir-web.

## Struktur

- `src/lib/axios.ts` — instance Axios tunggal + interceptor token & auto-logout 401
- `src/api/` — helper CRUD; semua network request lewat sini
- `src/store/` — Zustand (auth persisted)
- `src/components/ui/` — komponen dasar (Button, Badge, Modal, Pagination)
- `src/components/crud/ResourcePage.tsx` — halaman CRUD generik (list + cari + modal form + hapus)
- `src/components/layout/` — Sidebar + Header, menu menyesuaikan role
- `src/pages/` — halaman per modul

## Role & Tampilan

| Role | Menu |
|---|---|
| CAMPUS_ADMIN | Dashboard, master data, PMB (alur lengkap), dosen, mahasiswa (+riwayat semester, naik semester), jadwal, nilai, UKT, PKL/KP, TA, wisuda, alumni |
| LECTURER | Jadwal mengajar otomatis, input nilai, mahasiswa, bimbingan TA & PKL |
| STUDENT | Jadwal kuliah (+ruangan), KHS & transkrip |

## Menjalankan

```bash
cp .env.example .env   # arahkan VITE_API_BASE_URL ke akademika-service
npm install
npm run dev
```

## Deployment

Project Vercel: [akademika-web](https://vercel.com/kreativita/akademika-web). Branch `main` terhubung ke GitHub dan otomatis membangun web dengan `npm ci` serta `npm run build`. URL produksi: https://akademika-web.vercel.app.

API produksi diatur melalui `.env.production` ke `https://api.lokatech.id/akademika/api/v1`. Untuk pengembangan lokal, gunakan `.env` seperti contoh di atas.
# akademika-web
