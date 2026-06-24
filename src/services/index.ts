// Lapisan SERVICES — akses API & logika terkait frontend.
// Mengonsolidasi instance axios + helper CRUD/upload/download.
export { default as api } from '../lib/axios';
export * from '../api/crud';
export * from '../api/upload';
export * from '../api/download';
