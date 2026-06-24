# redux/

Slot untuk state global lanjutan via Redux Toolkit bila dibutuhkan.
Saat ini Akademika memakai **Zustand** (lihat `src/store/` & `src/context/`)
karena kebutuhan state masih ringan. Migrasi ke RTK dapat dilakukan di sini
tanpa mengubah konsumen jika tetap diekspos lewat `src/context/`.
