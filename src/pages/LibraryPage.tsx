import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BookOpen, Library, RotateCcw } from 'lucide-react';
import ResourcePage from '../components/crud/ResourcePage';
import { useOptions } from '../hooks/useList';
import { createResource, errorMessage, listResource, patchResource } from '../api/crud';
import { downloadFile } from '../api/download';
import api from '../lib/axios';
import { Badge, Button, EmptyState, Field, Modal, formatDate, formatRupiah, inputClass } from '../components/ui';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Segmented } from '@/components/ui/segmented';
import { Combobox } from '@/components/ui/combobox';
import { Card, CardContent } from '@/components/ui/card';
import type { ApiResponse, Book, BookLoan, Lecturer, Student } from '../types';

// Admin: katalog buku perpustakaan.
export function BooksPage() {
  return (
    <ResourcePage<Book>
      title="Katalog Buku"
      endpoint="/library/books"
      columns={[
        { key: 'title', label: 'Judul', sortable: true },
        { key: 'author', label: 'Pengarang', sortable: true },
        { key: 'category', label: 'Kategori', sortable: true },
        { key: 'shelf_location', label: 'Rak' },
        {
          key: 'available_copies',
          label: 'Stok',
          render: (b) => (
            <span className={b.available_copies === 0 ? 'text-rose-500' : ''}>
              {b.available_copies}/{b.total_copies}
            </span>
          ),
        },
      ]}
      fields={[
        { name: 'title', label: 'Judul Buku', type: 'text', required: true },
        { name: 'author', label: 'Pengarang', type: 'text' },
        { name: 'publisher', label: 'Penerbit', type: 'text' },
        { name: 'year', label: 'Tahun Terbit', type: 'number' },
        { name: 'isbn', label: 'ISBN', type: 'text' },
        { name: 'category', label: 'Kategori', type: 'text' },
        { name: 'shelf_location', label: 'Lokasi Rak', type: 'text' },
        { name: 'total_copies', label: 'Jumlah Eksemplar', type: 'number', required: true },
        { name: 'cover_url', label: 'Sampul', type: 'file', folder: 'library' },
      ]}
      toForm={(b) => ({
        title: b.title,
        author: b.author,
        publisher: b.publisher,
        year: b.year,
        isbn: b.isbn,
        category: b.category,
        shelf_location: b.shelf_location,
        total_copies: b.total_copies,
        cover_url: b.cover_url,
      })}
    />
  );
}

const loanStatusVariant: Record<string, string> = {
  dipinjam: 'dipinjam',
  dikembalikan: 'lunas',
  terlambat: 'terlambat',
};

// Admin/petugas: sirkulasi peminjaman & pengembalian buku.
export function LoansPage() {
  const [loans, setLoans] = useState<BookLoan[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBorrow, setShowBorrow] = useState(false);
  const [saving, setSaving] = useState(false);

  const books = useOptions<Book>('/library/books', (b) => `${b.title} (tersedia ${b.available_copies})`);
  const students = useOptions<Student>('/students', (s) => `${s.name} — ${s.nim ?? ''}`);
  const lecturers = useOptions<Lecturer>('/lecturers', (l) => l.name);

  const [bookId, setBookId] = useState('');
  const [borrowerType, setBorrowerType] = useState<'student' | 'lecturer'>('student');
  const [studentId, setStudentId] = useState('');
  const [lecturerId, setLecturerId] = useState('');
  const [dueDate, setDueDate] = useState('');

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await listResource<BookLoan>('/library/loans', { status: statusFilter || undefined, limit: 50 });
      setLoans(res.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const resetForm = () => {
    setBookId('');
    setBorrowerType('student');
    setStudentId('');
    setLecturerId('');
    setDueDate('');
  };

  const submitBorrow = async () => {
    setSaving(true);
    try {
      await createResource('/library/loans', {
        book_id: bookId,
        borrower_type: borrowerType,
        student_id: borrowerType === 'student' ? studentId : null,
        lecturer_id: borrowerType === 'lecturer' ? lecturerId : null,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
      });
      toast.success('Peminjaman dicatat');
      setShowBorrow(false);
      resetForm();
      void refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const returnBook = async (loan: BookLoan) => {
    try {
      const res = await patchResource<BookLoan>(`/library/loans/${loan.id}/return`, {});
      toast.success(res.fine > 0 ? `Dikembalikan — denda ${formatRupiah(res.fine)}` : 'Buku dikembalikan');
      void refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const borrowValid = bookId && dueDate && (borrowerType === 'student' ? studentId : lecturerId);

  const columns: Column<BookLoan>[] = [
    { title: 'Buku', key: 'book', render: (_, l) => l.book?.title ?? '-' },
    {
      title: 'Peminjam',
      key: 'borrower',
      render: (_, l) => (
        <span>
          {l.borrower_name}
          <span className="ml-1 text-xs text-muted-foreground">({l.borrower_type === 'student' ? 'Mhs' : 'Dosen'})</span>
        </span>
      ),
    },
    { title: 'Pinjam', key: 'loan_date', render: (_, l) => formatDate(l.loan_date) },
    { title: 'Jatuh Tempo', key: 'due_date', render: (_, l) => formatDate(l.due_date) },
    { title: 'Status', key: 'status', render: (_, l) => <Badge value={loanStatusVariant[l.status] ?? l.status} /> },
    { title: 'Denda', key: 'fine', render: (_, l) => (l.fine > 0 ? formatRupiah(l.fine) : '-') },
    {
      title: '',
      key: 'act',
      align: 'right',
      render: (_, l) =>
        l.status !== 'dikembalikan' ? (
          <Button variant="secondary" onClick={() => void returnBook(l)}>
            <RotateCcw size={14} className="mr-1 inline" /> Kembalikan
          </Button>
        ) : null,
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <Library size={20} className="text-primary" /> Sirkulasi Perpustakaan
        </h1>
        <Button onClick={() => setShowBorrow(true)}>Pinjam Buku</Button>
      </div>

      <div className="mb-3">
        <Segmented
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: '', label: 'Semua' },
            { value: 'dipinjam', label: 'Dipinjam' },
            { value: 'terlambat', label: 'Terlambat' },
            { value: 'dikembalikan', label: 'Dikembalikan' },
          ]}
        />
      </div>

      <DataTable<BookLoan> columns={columns} rowKey={(l) => l.id} data={loans} loading={loading} emptyText="Belum ada peminjaman" />

      <Modal open={showBorrow} title="Pinjam Buku" onClose={() => setShowBorrow(false)}>
        <div className="space-y-3">
          <Field label="Buku">
            <Combobox options={books} value={bookId} onChange={setBookId} allowClear placeholder="— pilih buku —" />
          </Field>
          <Field label="Tipe Peminjam">
            <select
              className={inputClass}
              value={borrowerType}
              onChange={(e) => setBorrowerType(e.target.value as 'student' | 'lecturer')}
            >
              <option value="student">Mahasiswa</option>
              <option value="lecturer">Dosen</option>
            </select>
          </Field>
          {borrowerType === 'student' ? (
            <Field label="Mahasiswa">
              <Combobox options={students} value={studentId} onChange={setStudentId} allowClear placeholder="— pilih mahasiswa —" />
            </Field>
          ) : (
            <Field label="Dosen">
              <Combobox options={lecturers} value={lecturerId} onChange={setLecturerId} allowClear placeholder="— pilih dosen —" />
            </Field>
          )}
          <Field label="Jatuh Tempo">
            <input type="date" className={inputClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowBorrow(false)}>Batal</Button>
            <Button disabled={!borrowValid || saving} onClick={() => void submitBorrow()}>Simpan</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Mahasiswa: katalog perpustakaan + riwayat peminjaman sendiri.
export function MyLibraryPage() {
  const [loans, setLoans] = useState<BookLoan[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [tab, setTab] = useState<'loans' | 'catalog'>('loans');

  useEffect(() => {
    void api.get<ApiResponse<BookLoan[]>>('/library/my-loans').then((res) => setLoans(res.data.data ?? [])).catch(() => setLoans([]));
    void listResource<Book>('/library/books', { limit: 100 }).then((res) => setBooks(res.data ?? [])).catch(() => setBooks([]));
  }, []);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <Library size={20} className="text-primary" /> Perpustakaan
        </h1>
        <Button variant="secondary" onClick={() => void downloadFile('/library/my-card/pdf', 'kartu-perpustakaan.pdf')}>
          Cetak Kartu Anggota
        </Button>
      </div>
      <div className="mb-4">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'loans', label: 'Pinjaman Saya' },
            { value: 'catalog', label: 'Katalog' },
          ]}
        />
      </div>

      {tab === 'loans' && (
        <div className="space-y-2">
          {loans.length === 0 && <EmptyState message="Belum ada peminjaman" />}
          {loans.map((l) => (
            <Card key={l.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{l.book?.title ?? '-'}</p>
                  <p className="text-xs text-muted-foreground">Jatuh tempo {formatDate(l.due_date)}</p>
                </div>
                <div className="text-right">
                  <Badge value={loanStatusVariant[l.status] ?? l.status} />
                  {l.fine > 0 && <p className="mt-1 text-xs text-rose-500">Denda {formatRupiah(l.fine)}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === 'catalog' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {books.length === 0 && <EmptyState message="Katalog masih kosong" />}
          {books.map((b) => (
            <Card key={b.id}>
              <CardContent className="p-4">
                <div className="mb-1 flex items-center gap-2">
                  <BookOpen size={16} className="text-primary" />
                  <h2 className="font-semibold leading-tight">{b.title}</h2>
                </div>
                <p className="text-sm text-muted-foreground">{b.author}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {b.category} · Rak {b.shelf_location || '-'} ·{' '}
                  <span className={b.available_copies === 0 ? 'text-rose-500' : 'text-emerald-600'}>
                    {b.available_copies > 0 ? `tersedia ${b.available_copies}` : 'habis'}
                  </span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
