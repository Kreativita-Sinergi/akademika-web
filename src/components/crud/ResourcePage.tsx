import { useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { createResource, deleteResource, errorMessage, updateResource } from '../../api/crud';
import { uploadFile } from '../../api/upload';
import { useList } from '../../hooks/useList';
import { Button, EmptyState, Field, Modal, Pagination, inputClass, type SelectOption } from '../ui';

export interface ColumnDef<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
}

export interface FieldDef {
  name: string;
  label: string;
  type: 'text' | 'number' | 'checkbox' | 'select' | 'date' | 'time' | 'password' | 'textarea' | 'file';
  options?: SelectOption[];
  required?: boolean;
  placeholder?: string;
  /** folder Cloudinary untuk type 'file' (default: misc) */
  folder?: string;
}

interface ResourcePageProps<T extends { id: string }> {
  title: string;
  endpoint: string;
  columns: ColumnDef<T>[];
  fields: FieldDef[];
  /** isi nilai form saat edit */
  toForm?: (item: T) => Record<string, unknown>;
  /** transformasi payload sebelum dikirim */
  toPayload?: (form: Record<string, unknown>) => Record<string, unknown>;
  /** aksi tambahan per baris */
  rowActions?: (item: T, refresh: () => void) => ReactNode;
  /** aksi tambahan di header */
  headerActions?: (refresh: () => void) => ReactNode;
  /** filter tambahan ke query list */
  extraParams?: Record<string, string | number | undefined>;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

// ResourcePage: halaman CRUD generik (list + cari + tambah/edit modal + hapus).
export default function ResourcePage<T extends { id: string }>({
  title,
  endpoint,
  columns,
  fields,
  toForm,
  toPayload,
  rowActions,
  headerActions,
  extraParams,
  canCreate = true,
  canEdit = true,
  canDelete = true,
}: ResourcePageProps<T>) {
  const { items, page, setPage, totalPage, search, setSearch, loading, refresh } = useList<T>(endpoint, extraParams);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const handleUpload = async (field: FieldDef, file: File) => {
    setUploading(field.name);
    try {
      const url = await uploadFile(file, field.folder ?? 'misc');
      setForm((prev) => ({ ...prev, [field.name]: url }));
      toast.success('File terunggah');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setUploading(null);
    }
  };

  const openCreate = () => {
    setEditing(null);
    const initial: Record<string, unknown> = {};
    fields.forEach((f) => {
      initial[f.name] = f.type === 'checkbox' ? false : f.type === 'number' ? 0 : '';
    });
    setForm(initial);
    setModalOpen(true);
  };

  const openEdit = (item: T) => {
    setEditing(item);
    setForm(toForm ? toForm(item) : { ...(item as Record<string, unknown>) });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = toPayload ? toPayload(form) : form;
      if (editing) {
        await updateResource(`${endpoint}/${editing.id}`, payload);
        toast.success('Data diperbarui');
      } else {
        await createResource(endpoint, payload);
        toast.success('Data dibuat');
      }
      setModalOpen(false);
      void refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: T) => {
    if (!confirm('Hapus data ini?')) return;
    try {
      await deleteResource(`${endpoint}/${item.id}`);
      toast.success('Data dihapus');
      void refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{title}</h1>
        <div className="flex items-center gap-2">
          {headerActions?.(refresh)}
          {canCreate && (
            <Button onClick={openCreate}>
              <span className="flex items-center gap-1">
                <Plus size={16} /> Tambah
              </span>
            </Button>
          )}
        </div>
      </div>

      <div className="mb-3 flex max-w-sm items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
        <Search size={16} className="text-slate-400" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari..."
          className="w-full text-sm focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 font-medium">
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    {col.render
                      ? col.render(item)
                      : String((item as Record<string, unknown>)[col.key] ?? '-')}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {rowActions?.(item, refresh)}
                    {canEdit && (
                      <button onClick={() => openEdit(item)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100" title="Edit">
                        <Pencil size={15} />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => void handleDelete(item)} className="rounded p-1.5 text-red-500 hover:bg-red-50" title="Hapus">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && items.length === 0 && <EmptyState message="Belum ada data" />}
      </div>

      <Pagination page={page} totalPage={totalPage} onChange={setPage} />

      <Modal open={modalOpen} title={editing ? `Edit ${title}` : `Tambah ${title}`} onClose={() => setModalOpen(false)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
          className="space-y-3"
        >
          {fields.map((f) => (
            <Field key={f.name} label={f.label}>
              {f.type === 'select' ? (
                <select
                  className={inputClass}
                  value={String(form[f.name] ?? '')}
                  required={f.required}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                >
                  <option value="">— pilih —</option>
                  {f.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : f.type === 'checkbox' ? (
                <input
                  type="checkbox"
                  checked={Boolean(form[f.name])}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.checked })}
                  className="h-4 w-4"
                />
              ) : f.type === 'file' ? (
                <div className="space-y-1">
                  <input
                    type="file"
                    className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-700"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleUpload(f, file);
                    }}
                  />
                  {uploading === f.name && <span className="text-xs text-slate-400">Mengunggah...</span>}
                  {Boolean(form[f.name]) && uploading !== f.name && (
                    <a
                      href={String(form[f.name])}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-xs text-primary-600 underline"
                    >
                      Lihat file terunggah
                    </a>
                  )}
                </div>
              ) : f.type === 'textarea' ? (
                <textarea
                  className={inputClass}
                  value={String(form[f.name] ?? '')}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  rows={3}
                />
              ) : (
                <input
                  type={f.type}
                  className={inputClass}
                  value={String(form[f.name] ?? '')}
                  required={f.required}
                  placeholder={f.placeholder}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [f.name]: f.type === 'number' ? Number(e.target.value) : e.target.value,
                    })
                  }
                />
              )}
            </Field>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
