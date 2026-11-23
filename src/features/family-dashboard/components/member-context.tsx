'use client';

import { createContext, useContext } from 'react';

/** Shared member info passed from page → layout (breadcrumb) */
export interface MemberContextValue {
  id: string | null;
  name: string | null;
}

export const MemberContext = createContext<MemberContextValue>({ id: null, name: null });

export function useMemberName(): string | null {
  return useContext(MemberContext).name;
}
