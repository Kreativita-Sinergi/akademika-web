import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { getResource } from '../api/crud';
import { dayNames } from '../components/ui';
import { useAuthStore } from '../store/auth';
import type { Schedule } from '../types';

// Jadwal otomatis untuk dosen (mengajar) & mahasiswa (kuliah + ruangan).
export default function MySchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const role = useAuthStore((s) => s.user?.role);

  useEffect(() => {
    void getResource<Schedule[]>('/schedules/my')
      .then((items) => setSchedules(items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const byDay = new Map<number, Schedule[]>();
  schedules.forEach((s) => {
    const list = byDay.get(s.day_of_week) ?? [];
    list.push(s);
    byDay.set(s.day_of_week, list);
  });

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">
        {role === 'LECTURER' ? 'Jadwal Mengajar Saya' : 'Jadwal Kuliah Saya'}
      </h1>
      <p className="mb-5 text-sm text-slate-500">
        {role === 'LECTURER'
          ? 'Jadwal terbentuk otomatis dari penjadwalan yang diinput admin kampus.'
          : 'Jadwal kelas Anda lengkap dengan ruangan tiap mata kuliah.'}
      </p>

      {loading && <div className="py-12 text-center text-slate-400">Memuat...</div>}
      {!loading && schedules.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center text-slate-400">
          Belum ada jadwal pada tahun akademik aktif
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6, 7]
          .filter((day) => byDay.has(day))
          .map((day) => (
            <div key={day} className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-4 py-3 font-semibold">{dayNames[day]}</div>
              <div className="divide-y divide-slate-100">
                {(byDay.get(day) ?? [])
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((s) => (
                    <div key={s.id} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{s.course?.name ?? '-'}</span>
                        <span className="text-sm text-slate-500">
                          {s.start_time}–{s.end_time}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-sm text-slate-500">
                        <span>
                          {role === 'LECTURER' ? `Kelas ${s.class_group?.code ?? '-'}` : s.lecturer?.name ?? '-'}
                        </span>
                        <span className="flex items-center gap-1 font-medium text-primary-600">
                          <MapPin size={13} />
                          {s.room ? `${s.room.code} · ${s.room.building}` : '-'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
