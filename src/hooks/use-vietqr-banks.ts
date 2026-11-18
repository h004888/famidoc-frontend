'use client';

import { useEffect, useState } from 'react';
import { publicApi } from '@/lib/api/public.api';
import { FALLBACK_VIETQR_BANKS, type VietQRBankItem } from '@/lib/vietqr';

export function useVietQrBanks() {
  const [banks, setBanks] = useState<VietQRBankItem[]>(FALLBACK_VIETQR_BANKS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    publicApi
      .getBanks()
      .then((items) => {
        if (active && Array.isArray(items) && items.length > 0) {
          setBanks(items);
        }
      })
      .catch(() => {
        // Giữ danh sách fallback nếu API gặp sự cố
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { banks, isLoading };
}
