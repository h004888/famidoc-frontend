export interface StatItem {
  icon: string;
  value: string;
  label: string;
}

export interface DoctorCardData {
  id: string;
  name: string;
  title: string;
  rating: number;
  consultations: string;
  experience: string;
  license: string;
  avatarUrl: string;
}

export interface TestimonialData {
  quote: string;
  author: string;
  location: string;
  initials: string;
  rating: number;
}

export interface CorePackageData {
  id: string;
  name: string;
  tag: string;
  tagType: 'standard' | 'popular' | 'advanced' | 'vip';
  price: number;
  period: string;
  description: string;
  icon: string;
  isPopular?: boolean;
  features: string[];
  ctaText: string;
}

export interface ProcessStepData {
  step: number;
  title: string;
  description: string;
}

export type PackageInterest = 'BASIC' | 'FAMILY' | 'ELDERLY' | 'VIP';

export interface ConsultationLeadInput {
  fullName: string;
  phoneNumber: string;
  packageInterest: PackageInterest;
  notes?: string;
}

export interface ConsultationLeadResponse {
  success: boolean;
  leadId?: string;
  message?: string;
}
