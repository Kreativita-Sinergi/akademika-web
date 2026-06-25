import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface State {
  hasError: boolean;
}

// ErrorBoundary — menangkap crash render agar tak menampilkan layar putih.
// Di-reset otomatis saat pindah halaman (key={location.pathname} di Layout).
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('UI error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold">Terjadi kesalahan pada halaman ini</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Maaf, terjadi galat tak terduga. Coba muat ulang halaman; bila berlanjut, hubungi admin sistem.
          </p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" /> Muat ulang
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
