'use client';

import React from 'react';
import {
  BloodPressureMonitor,
  DiabetesMeasure,
  Doctor,
  Heartbeat,
  Home,
  Medicines,
  PrescriptionDocument,
  PulseOximeter,
  Telemedicine,
} from '@healthicons/react';

export type MedicalDomainIconName =
  | 'doctor'
  | 'blood-pressure'
  | 'spo2'
  | 'heart-rate'
  | 'glucose'
  | 'prescription'
  | 'medical-book'
  | 'home-visit'
  | 'telemedicine';

const MEDICAL_ICON_MAP = {
  doctor: Doctor,
  'blood-pressure': BloodPressureMonitor,
  spo2: PulseOximeter,
  'heart-rate': Heartbeat,
  glucose: DiabetesMeasure,
  prescription: Medicines,
  'medical-book': PrescriptionDocument,
  'home-visit': Home,
  telemedicine: Telemedicine,
} as const;

export interface MedicalDomainIconProps {
  name: MedicalDomainIconName;
  size?: number | string;
  variant?: 'outline' | 'filled';
  className?: string;
  title?: string;
}

export function MedicalDomainIcon({
  name,
  size = 20,
  variant = 'outline',
  className,
  title,
}: MedicalDomainIconProps) {
  const Icon = MEDICAL_ICON_MAP[name];

  return (
    <Icon
      variant={variant}
      size={size}
      className={className}
      data-medical-icon={name}
      aria-hidden={title ? undefined : 'true'}
      title={title}
    />
  );
}
