import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MapPin, Crosshair } from 'lucide-react';
import api from '../lib/axios';
import { errorMessage } from '../api/crud';
import { Button, Field, inputClass } from '../components/ui';
import type { ApiResponse } from '../types';

interface Campus {
  geofence_lat: number | null;
  geofence_lng: number | null;
  geofence_radius_m: number;
  [k: string]: unknown;
}

// Admin: konfigurasi geofence presensi mandiri (radius area kampus).
export default function AttendanceSettingsPage() {
  const [campus, setCampus] = useState<Campus | null>(null);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('0');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void api.get<ApiResponse<Campus>>('/campus').then((res) => {
      const c = res.data.data;
      setCampus(c);
      setLat(c.geofence_lat != null ? String(c.geofence_lat) : '');
      setLng(c.geofence_lng != null ? String(c.geofence_lng) : '');
      setRadius(String(c.geofence_radius_m ?? 0));
    });
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error('Browser tidak mendukung lokasi');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(7));
        setLng(pos.coords.longitude.toFixed(7));
        toast.success('Lokasi terisi dari posisi Anda');
      },
      () => toast.error('Gagal mengambil lokasi'),
    );
  };

  const save = async () => {
    if (!campus) return;
    setSaving(true);
    try {
      await api.put('/campus', {
        ...campus,
        geofence_lat: lat ? Number(lat) : null,
        geofence_lng: lng ? Number(lng) : null,
        geofence_radius_m: Number(radius) || 0,
      });
      toast.success('Pengaturan geofence disimpan');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="mb-4 flex items-center gap-2 text-xl font-semibold">
        <MapPin size={20} className="text-primary-600" /> Pengaturan Presensi (Geofence)
      </h1>
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="mb-4 text-sm text-slate-500">
          Tetapkan titik pusat & radius kampus. Presensi mandiri (QR) hanya diterima bila mahasiswa
          berada dalam radius ini. Isi <b>radius 0</b> untuk menonaktifkan validasi lokasi.
        </p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Latitude"><input className={inputClass} value={lat} onChange={(e) => setLat(e.target.value)} placeholder="-6.2000000" /></Field>
            <Field label="Longitude"><input className={inputClass} value={lng} onChange={(e) => setLng(e.target.value)} placeholder="106.8000000" /></Field>
          </div>
          <button onClick={useMyLocation} className="flex items-center gap-1 text-sm text-primary-600 hover:underline">
            <Crosshair size={14} /> Gunakan lokasi saya saat ini
          </button>
          <Field label="Radius (meter)">
            <input type="number" className={inputClass} value={radius} onChange={(e) => setRadius(e.target.value)} />
          </Field>
          <div className="flex justify-end pt-2">
            <Button disabled={saving} onClick={() => void save()}>Simpan</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
