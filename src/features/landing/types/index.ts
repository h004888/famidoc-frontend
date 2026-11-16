export interface StatItem {
  icon: string;
  value: string;
  label: string;
}

export interface LandingPortalMetrics {
  totalPartnerFacilities: number;
  totalDoctors: number;
  totalActivePackages: number;
  totalFamiliesServed: number;
}

export interface LandingDoctorFacility {
  id: string;
  facilityName: string;
  address?: string;
  hotline?: string;
}

export interface LandingDoctorItem {
  id: string;
  doctorName: string;
  specialty: string;
  academicTitle?: string | null;
  experienceYears?: number;
  bio?: string | null;
  ratingAvg?: number;
  totalReviews?: number;
  isAvailable?: boolean;
  avatarUrl?: string | null;
  facility?: LandingDoctorFacility | null;
}

export interface LandingPackageItem {
  id: string;
  packageCode: string;
  packageName: string;
  durationMonths: number;
  basePrice: number;
  periodicVisitsQuota: number;
  telehealthQuota: number;
  videoQuotaPolicy?: string | null;
  homeVisitUnitPriceVnd?: number;
  maxMembers: number;
  includedMembers?: number;
  additionalMemberMonthlyPrice?: number;
  quotaPeriod?: string | null;
  description: string;
}

export interface HomePageData {
  metrics: LandingPortalMetrics | null;
  doctors: LandingDoctorItem[];
  totalDoctors: number;
  packages: LandingPackageItem[];
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
  phone: string;
  email: string;
  healthNeeds: string;
  preferredPackageId?: string;
}

export interface ConsultationLeadResponse {
  success: boolean;
  ticketId?: string;
  message?: string;
}
