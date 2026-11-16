'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * Ngữ cảnh hợp đồng mà các bước con báo cáo lên `BookingOnboardingShell`.
 * Shell không tự gọi API: chỉ dùng dữ liệu do bước hiện tại cung cấp để dựng
 * nút `Quay lại` và trạng thái bấm được của thanh tiến trình.
 */
export interface BookingNavigationState {
  /** Bác sĩ đang được chọn ở Bước 1 (dùng cho đích quay lại `/doctors/<id>`). */
  doctorId?: string;
  /** Hợp đồng đang thao tác (dùng để giữ `?contractId=` khi điều hướng lùi). */
  contractId?: string;
  /** Trạng thái hợp đồng do backend trả về (chuỗi thô) để khóa điều hướng khi đã `ACTIVE`. */
  contractStatus?: string;
  /** Cho biết có tồn tại một bước phía trước có thể quay lại (chỉ dùng cho bước 1). */
}

interface BookingNavigationContextValue {
  state: BookingNavigationState;
  update: (patch: BookingNavigationState) => void;
  reset: () => void;
}

const EMPTY_STATE: BookingNavigationState = {};

const BookingNavigationContext =
  createContext<BookingNavigationContextValue | null>(null);

export function BookingNavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<BookingNavigationState>(EMPTY_STATE);

  const update = useCallback((patch: BookingNavigationState) => {
    setState((prev) => {
      const keys = Object.keys(patch) as Array<keyof BookingNavigationState>;
      const changed = keys.some((key) => prev[key] !== patch[key]);
      return changed ? { ...prev, ...patch } : prev;
    });
  }, []);

  const reset = useCallback(() => {
    setState((prev) => (Object.keys(prev).length === 0 ? prev : EMPTY_STATE));
  }, []);

  const value = useMemo<BookingNavigationContextValue>(
    () => ({ state, update, reset }),
    [state, update, reset]
  );

  return (
    <BookingNavigationContext.Provider value={value}>
      {children}
    </BookingNavigationContext.Provider>
  );
}

/**
 * Trả về context nếu có provider; trả `null` khi bước được render ngoài luồng
 * `/booking` (ví dụ `/family/subscription/tracking`) để không làm hỏng trang đó.
 */
export function useBookingNavigationOptional(): BookingNavigationContextValue | null {
  return useContext(BookingNavigationContext);
}

/**
 * Phiên bản bắt buộc dùng bên trong `BookingOnboardingShell`.
 */
export function useBookingNavigation(): BookingNavigationContextValue {
  const context = useContext(BookingNavigationContext);
  if (!context) {
    throw new Error(
      'useBookingNavigation phải được dùng bên trong BookingNavigationProvider'
    );
  }
  return context;
}
