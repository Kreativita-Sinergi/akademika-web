import { useCallback, useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Upload as UploadIcon } from 'lucide-react';
import { createResource, deleteResource, errorMessage, listResource, updateResource } from '../../api/crud';
import { uploadFile } from '../../api/upload';
import { Modal } from '../molecules';
import { Field, type SelectOption } from '../atoms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Combobox } from '@/components/ui/combobox';
import { DataTable, type Column, type ListParams } from '@/components/ui/data-table';

export interface ColumnDef<T> {
  key: string;
  label: string;
  /** kolom DB untuk sortir server-side; aktifkan klik-sortir di header */
  sortable?: boolean;
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
  toForm?: (item: T) => Record<string, unknown>;
  toPayload?: (form: Record<string, unknown>) => Record<string, unknown>;
  rowActions?: (item: T, reload: () => void) => ReactNode;
  headerActions?: (reload: () => void) => ReactNode;
  extraParams?: Record<string, string | number | undefined>;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

// Organism ResourcePage: halaman CRUD generik berbasis DataTable (mode server:
// search, sort, & paginasi terintegrasi dalam satu kartu — seperti Inventra).
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
  const [reloadKey, setReloadKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const reload = () => setReloadKey((k) => k + 1);
  const fetcher = useCallback((params: ListParams) => listResource<T>(endpoint, params), [endpoint]);

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
      reload();
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
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const tableColumns: Column<T>[] = [
    ...columns.map((col) => ({
      title: col.label,
      key: col.key,
      sortable: col.sortable,
      sortKey: col.key,
      render: (_: unknown, item: T) =>
        col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '-'),
    })),
    {
      title: 'Aksi',
      key: '__actions',
      align: 'right' as const,
      width: 120,
      render: (_: unknown, item: T) => (
        <div className="flex items-center justify-end gap-1">
          {rowActions?.(item, reload)}
          {canEdit && (
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => void handleDelete(item)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold tracking-tight">{title}</h1>

      <DataTable<T>
        fetcher={fetcher}
        columns={tableColumns}
        rowKey={(item) => item.id}
        reloadKey={reloadKey}
        extraParams={extraParams}
        searchable
        exportable
        exportName={title}
        searchPlaceholder="Cari..."
        toolbar={
          <>
            {headerActions?.(reload)}
            {canCreate && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> Tambah
              </Button>
            )}
          </>
        }
      />

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
                <Combobox
                  options={f.options ?? []}
                  value={(form[f.name] as string) || ''}
                  allowClear
                  placeholder="— pilih —"
                  onChange={(v) => setForm({ ...form, [f.name]: v })}
                />
              ) : f.type === 'checkbox' ? (
                <div className="pt-1">
                  <Switch
                    checked={Boolean(form[f.name])}
                    onCheckedChange={(v) => setForm({ ...form, [f.name]: v })}
                  />
                </div>
              ) : f.type === 'file' ? (
                <div className="space-y-1">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
                    <UploadIcon className="h-4 w-4" />
                    {uploading === f.name ? 'Mengunggah...' : 'Unggah File'}
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleUpload(f, file);
                      }}
                    />
                  </label>
                  {Boolean(form[f.name]) && uploading !== f.name && (
                    <a href={String(form[f.name])} target="_blank" rel="noreferrer" className="block truncate text-xs text-primary underline">
                      Lihat file terunggah
                    </a>
                  )}
                </div>
              ) : f.type === 'textarea' ? (
                <Textarea
                  rows={3}
                  value={String(form[f.name] ?? '')}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                />
              ) : f.type === 'number' ? (
                <Input
                  type="number"
                  value={String(form[f.name] ?? '')}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value === '' ? 0 : Number(e.target.value) })}
                />
              ) : (
                <Input
                  type={f.type}
                  value={String(form[f.name] ?? '')}
                  required={f.required}
                  placeholder={f.placeholder}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                />
              )}
            </Field>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
