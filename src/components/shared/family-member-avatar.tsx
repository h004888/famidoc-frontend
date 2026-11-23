'use client';

import React from 'react';
import {
  Boy1015y,
  Girl1015y,
  Man,
  OldMan,
  OldWoman,
  Person,
  Woman,
} from '@healthicons/react';

export type MemberAvatarKind =
  | 'elderly-woman'
  | 'elderly-man'
  | 'girl'
  | 'boy'
  | 'woman'
  | 'man'
  | 'person';

export interface ResolveMemberAvatarParams {
  relationship?: string;
  gender?: string;
  age?: number;
}

export function resolveMemberAvatarKind({
  gender,
  age,
}: ResolveMemberAvatarParams): MemberAvatarKind {
  const normalizedGender = (gender ?? '').trim().toUpperCase();
  const isFemale = normalizedGender === 'FEMALE' || normalizedGender === 'NỮ';
  const isOther = normalizedGender === 'OTHER' || normalizedGender === 'KHÁC';

  if (typeof age === 'number' && age >= 60) {
    return isFemale ? 'elderly-woman' : 'elderly-man';
  }
  if (typeof age === 'number' && age < 18) {
    return isFemale ? 'girl' : 'boy';
  }
  if (isFemale) return 'woman';
  if (isOther) return 'person';
  return 'man';
}

const AVATAR_COMPONENTS = {
  'elderly-woman': OldWoman,
  'elderly-man': OldMan,
  girl: Girl1015y,
  boy: Boy1015y,
  woman: Woman,
  man: Man,
  person: Person,
} as const;

export interface FamilyMemberAvatarProps extends ResolveMemberAvatarParams {
  size?: number | string;
  variant?: 'outline' | 'filled';
  className?: string;
  title?: string;
}

export function FamilyMemberAvatar({
  relationship,
  gender,
  age,
  size = 26,
  variant = 'outline',
  className,
  title,
}: FamilyMemberAvatarProps) {
  const kind = resolveMemberAvatarKind({ relationship, gender, age });
  const Icon = AVATAR_COMPONENTS[kind];

  return (
    <Icon
      variant={variant}
      size={size}
      className={className}
      data-avatar-kind={kind}
      aria-hidden={title ? undefined : 'true'}
      title={title}
    />
  );
}
