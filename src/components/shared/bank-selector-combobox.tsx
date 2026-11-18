'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Landmark, Search } from 'lucide-react';
import type { VietQRBankItem } from '@/lib/vietqr';
import { cn } from '@/lib/utils';

export interface BankSelectorComboboxProps {
  banks: VietQRBankItem[];
  selectedBank: VietQRBankItem | null;
  fallbackBankName?: string;
  loading?: boolean;
  disabled?: boolean;
  hasError?: boolean;
  onSelect: (bank: VietQRBankItem) => void;
}

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export function BankSelectorCombobox({
  banks,
  selectedBank,
  fallbackBankName,
  loading = false,
  disabled = false,
  hasError = false,
  onSelect,
}: BankSelectorComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [brokenLogos, setBrokenLogos] = useState<Record<string, boolean>>({});
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    } else {
      setQuery('');
    }
  }, [open]);

  const filteredBanks = useMemo(() => {
    const q = normalizeSearch(query);
    const ordered = [...banks].sort((a, b) => {
      if (a.transferSupported !== b.transferSupported) {
        return b.transferSupported - a.transferSupported;
      }
      return a.shortName.localeCompare(b.shortName, 'vi');
    });

    if (!q) return ordered;
    return ordered.filter((bank) => {
      const haystack = normalizeSearch(
        `${bank.shortName} ${bank.code} ${bank.bin} ${bank.name}`,
      );
      return haystack.includes(q);
    });
  }, [banks, query]);

  const renderBankLogo = (bank: VietQRBankItem) => {
    if (!bank.logo || brokenLogos[bank.bin]) {
      return (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
          <Landmark className="h-3.5 w-3.5" />
        </span>
      );
    }
    return (
      <img
        src={bank.logo}
        alt={bank.shortName}
        className="h-7 w-11 shrink-0 rounded-md border border-slate-100 bg-white object-contain p-0.5"
        onError={() =>
          setBrokenLogos((prev) => ({ ...prev, [bank.bin]: true }))
        }
      />
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        role="combobox"
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Chọn ngân hàng thụ hưởng"
        data-testid="bank-selector-trigger"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev);
        }}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs sm:text-sm transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:bg-slate-100 disabled:cursor-not-allowed',
          hasError
            ? 'border-rose-400 bg-rose-50/30'
            : 'border-slate-200 bg-white hover:border-slate-300',
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {selectedBank ? (
            <>
              {renderBankLogo(selectedBank)}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-900 truncate">
                    {selectedBank.shortName}
                  </span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 tabular-nums">
                    {selectedBank.code} · {selectedBank.bin}
                  </span>
                </div>
                <p className="truncate text-[11px] text-slate-500">
                  {selectedBank.name}
                </p>
              </div>
            </>
          ) : fallbackBankName ? (
            <span className="truncate font-medium text-slate-800">
              {fallbackBankName}
            </span>
          ) : (
            <span className="truncate text-slate-400">
              {loading
                ? 'Đang tải danh sách ngân hàng VietQR...'
                : 'Chọn ngân hàng (Vietcombank, BIDV, MB...)'}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-slate-400 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm tên ngân hàng, mã VCB hoặc BIN 970436..."
              aria-label="Tìm kiếm ngân hàng"
              className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden"
            />
          </div>

          <ul
            id={listboxId}
            role="listbox"
            aria-label="Danh sách ngân hàng VietQR"
            className="max-h-64 overflow-y-auto p-1"
          >
            {filteredBanks.length === 0 ? (
              <li className="px-3 py-4 text-center text-xs text-slate-500">
                Không tìm thấy ngân hàng phù hợp với &ldquo;{query}&rdquo;.
              </li>
            ) : (
              filteredBanks.map((bank) => {
                const isSelected =
                  selectedBank?.bin === bank.bin &&
                  selectedBank?.code === bank.code;
                const supportsQr = bank.transferSupported === 1;
                return (
                  <li
                    key={`${bank.bin}-${bank.code}`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(bank);
                        setOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors hover:bg-blue-50/70',
                        isSelected && 'bg-blue-50 text-blue-900',
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        {renderBankLogo(bank)}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-semibold text-slate-900">
                              {bank.shortName}
                            </span>
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 tabular-nums">
                              {bank.code} · {bank.bin}
                            </span>
                            {!supportsQr && (
                              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 border border-amber-200">
                                Hạn chế VietQR
                              </span>
                            )}
                          </div>
                          <p className="truncate text-[11px] text-slate-500">
                            {bank.name}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 shrink-0 text-blue-600" />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
