import { useState } from 'react'
import { Check, ChevronsUpDown, X, Plus, Loader2 } from 'lucide-react'
import { Button } from './button'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from './command'
import { cn } from '@/lib/utils'

export interface ComboOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  emptyText?: string
  allowClear?: boolean
  disabled?: boolean
  className?: string
  /**
   * Bila diisi, dropdown jadi "creatable": saat input pencarian tidak cocok
   * dengan opsi mana pun, muncul item "Tambah '<input>'" yang memanggil onCreate.
   * onCreate harus mengembalikan opsi baru (atau null bila gagal); opsi itu
   * langsung dipilih.
   */
  onCreate?: (input: string) => Promise<ComboOption | null>
}

// Combobox — single-select dengan pencarian (pengganti AntD Select). Dipakai
// untuk semua dropdown (barang, gudang, kategori, satuan, role, jenis transaksi).
// Mendukung mode creatable lewat prop onCreate.
export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Pilih...',
  emptyText = 'Tidak ditemukan',
  allowClear = false,
  disabled,
  className,
  onCreate,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  // Opsi yang baru dibuat lewat onCreate — disimpan lokal agar label terpilih
  // langsung tampil meski parent belum sempat memperbarui daftar options.
  const [extra, setExtra] = useState<ComboOption[]>([])

  const allOptions = [...options, ...extra.filter((e) => !options.some((o) => o.value === e.value))]
  const selected = allOptions.find((o) => o.value === value)

  const trimmed = query.trim()
  const hasExact = allOptions.some((o) => o.label.trim().toLowerCase() === trimmed.toLowerCase())
  const showCreate = !!onCreate && trimmed.length > 0 && !hasExact

  const handleCreate = async () => {
    if (!onCreate || creating) return
    setCreating(true)
    try {
      const created = await onCreate(trimmed)
      if (created) {
        setExtra((prev) => [...prev, created])
        onChange(created.value)
        setQuery('')
        setOpen(false)
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery('') }}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn('w-full justify-between font-normal', !selected && 'text-muted-foreground', className)}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <span className="flex items-center gap-1">
            {allowClear && selected && (
              <X
                className="h-4 w-4 opacity-50 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange('')
                }}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Cari..." value={query} onValueChange={setQuery} />
          <CommandList>
            {!showCreate && <CommandEmpty>{emptyText}</CommandEmpty>}
            {allOptions.map((opt) => (
              <CommandItem
                key={opt.value}
                value={opt.label}
                onSelect={() => {
                  onChange(opt.value)
                  setQuery('')
                  setOpen(false)
                }}
              >
                <Check className={cn('h-4 w-4', value === opt.value ? 'opacity-100' : 'opacity-0')} />
                {opt.label}
              </CommandItem>
            ))}
            {showCreate && (
              <CommandItem value={`__create__${trimmed}`} onSelect={handleCreate} className="text-primary">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Tambah "{trimmed}"
              </CommandItem>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
