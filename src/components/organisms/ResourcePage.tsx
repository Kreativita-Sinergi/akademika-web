import { useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import { Table, Input, InputNumber, Select, Checkbox, Upload, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { createResource, deleteResource, errorMessage, updateResource } from '../../api/crud';
import { uploadFile } from '../../api/upload';
import { useList } from '../../hooks/useList';
import { Modal, Pagination } from '../molecules';
import { Button, Field, type SelectOption } from '../atoms';

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
  toForm?: (item: T) => Record<string, unknown>;
  toPayload?: (form: Record<string, unknown>) => Record<string, unknown>;
  rowActions?: (item: T, refresh: () => void) => ReactNode;
  headerActions?: (refresh: () => void) => ReactNode;
  extraParams?: Record<string, string | number | undefined>;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

// Organism ResourcePage: halaman CRUD generik berbasis Ant Design Table + Form.
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

  const tableColumns: ColumnsType<T> = [
    ...columns.map((col) => ({
      title: col.label,
      key: col.key,
      render: (_: unknown, item: T) =>
        col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '-'),
    })),
    {
      title: 'Aksi',
      key: '__actions',
      align: 'right' as const,
      width: 120,
      render: (_: unknown, item: T) => (
        <Space size={4}>
          {rowActions?.(item, refresh)}
          {canEdit && <Button variant="ghost" onClick={() => openEdit(item)}><EditOutlined /></Button>}
          {canDelete && <Button variant="ghost" onClick={() => void handleDelete(item)}><DeleteOutlined style={{ color: '#ef4444' }} /></Button>}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{title}</h1>
        <Space>
          {headerActions?.(refresh)}
          {canCreate && (
            <Button onClick={openCreate}>
              <span className="flex items-center gap-1"><PlusOutlined /> Tambah</span>
            </Button>
          )}
        </Space>
      </div>

      <div className="mb-3 max-w-sm">
        <Input
          allowClear
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder="Cari..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <Table<T>
        rowKey="id"
        loading={loading}
        columns={tableColumns}
        dataSource={items}
        pagination={false}
        size="middle"
        scroll={{ x: 'max-content' }}
      />

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
                <Select
                  className="w-full"
                  value={(form[f.name] as string) || undefined}
                  placeholder="— pilih —"
                  options={f.options}
                  showSearch
                  optionFilterProp="label"
                  onChange={(v) => setForm({ ...form, [f.name]: v })}
                />
              ) : f.type === 'checkbox' ? (
                <Checkbox
                  checked={Boolean(form[f.name])}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.checked })}
                />
              ) : f.type === 'file' ? (
                <div className="space-y-1">
                  <Upload
                    showUploadList={false}
                    beforeUpload={(file) => {
                      void handleUpload(f, file as File);
                      return false;
                    }}
                  >
                    <Button variant="secondary">
                      <span className="flex items-center gap-1"><UploadOutlined /> {uploading === f.name ? 'Mengunggah...' : 'Unggah File'}</span>
                    </Button>
                  </Upload>
                  {Boolean(form[f.name]) && uploading !== f.name && (
                    <a href={String(form[f.name])} target="_blank" rel="noreferrer" className="block truncate text-xs text-primary-600 underline">
                      Lihat file terunggah
                    </a>
                  )}
                </div>
              ) : f.type === 'textarea' ? (
                <Input.TextArea
                  rows={3}
                  value={String(form[f.name] ?? '')}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                />
              ) : f.type === 'number' ? (
                <InputNumber
                  className="w-full"
                  value={form[f.name] as number}
                  onChange={(v) => setForm({ ...form, [f.name]: v ?? 0 })}
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
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
