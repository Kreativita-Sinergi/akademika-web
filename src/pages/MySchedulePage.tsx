import { useEffect, useState } from 'react';
import { Loader2, MapPin, Clock } from 'lucide-react';
import { getResource } from '../api/crud';
import { dayNames } from '../components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '../components/atoms';
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
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">
          {role === 'LECTURER' ? 'Jadwal Mengajar Saya' : 'Jadwal Kuliah Saya'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {role === 'LECTURER'
            ? 'Jadwal terbentuk otomatis dari penjadwalan yang diinput admin kampus.'
            : 'Jadwal kelas Anda lengkap dengan ruangan tiap mata kuliah.'}
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
        </div>
      )}
      {!loading && schedules.length === 0 && <EmptyState message="Belum ada jadwal pada tahun akademik aktif" />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6, 7]
          .filter((day) => byDay.has(day))
          .map((day) => (
            <Card key={day}>
              <CardHeader>
                <CardTitle className="text-base">{dayNames[day]}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {(byDay.get(day) ?? [])
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((s, i, arr) => (
                    <div key={s.id} className={`px-4 py-3 ${i < arr.length - 1 ? 'border-b border-border/70' : ''}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{s.course?.name ?? '-'}</span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />{s.start_time}–{s.end_time}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[13px] text-muted-foreground">
                        <span>{role === 'LECTURER' ? `Kelas ${s.class_group?.code ?? '-'}` : s.lecturer?.name ?? '-'}</span>
                        <span className="inline-flex items-center gap-1 font-medium text-primary">
                          <MapPin className="h-3.5 w-3.5" /> {s.room ? `${s.room.code} · ${s.room.building}` : '-'}
                        </span>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
