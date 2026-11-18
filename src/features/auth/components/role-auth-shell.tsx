'use client';

import React, { useEffect, useState } from 'react';
import { Building2, ShieldCheck, Stethoscope } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  getCurrentBrowserHost,
  getCurrentBrowserProto,
  getPortalOrigin,
} from '@/lib/portal-routing';

export type AuthTargetRole = 'ADMIN' | 'FACILITY' | 'DOCTOR';

export interface RoleAuthConfig {
  role: AuthTargetRole;
  badgeLabel: string;
  badgeClass: string;
  badgeIcon: React.ReactNode;
  loginTitle: string;
  registerTitle: string;
  buttonClass: string;
  topAccentClass: string;
  pageBackground: string;
  ambientTopClass: string;
  ambientBottomClass: string;
}

export const ROLE_AUTH_CONFIGS: Record<AuthTargetRole, RoleAuthConfig> = {
  ADMIN: {
    role: 'ADMIN',
    badgeLabel: 'Phân Hệ Quản Trị Viên',
    badgeClass: 'border-indigo-200/90 bg-indigo-50 text-indigo-800',
    badgeIcon: <ShieldCheck className="size-3.5 text-indigo-600" />,
    loginTitle: 'Đăng nhập Quản trị viên',
    registerTitle: 'Cổng Quản Trị Hệ Thống',
    buttonClass: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20',
    topAccentClass: 'bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-500',
    pageBackground:
      'radial-gradient(110% 95% at 0% 0%, #FFFFFF 0%, #EEF2FF 48%, #E0E7FF 100%)',
    ambientTopClass: 'bg-indigo-400/20',
    ambientBottomClass: 'bg-blue-400/15',
  },

  FACILITY: {
    role: 'FACILITY',
    badgeLabel: 'Phân Hệ Cơ Sở Y Tế',
    badgeClass: 'border-blue-200/90 bg-blue-50 text-blue-800',
    badgeIcon: <Building2 className="size-3.5 text-blue-600" />,
    loginTitle: 'Đăng nhập Cơ sở Y tế',
    registerTitle: 'Đăng ký Cơ sở Y tế Đối tác',
    buttonClass: 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20',
    topAccentClass: 'bg-gradient-to-r from-[#0037c1] via-blue-600 to-cyan-500',
    pageBackground:
      'radial-gradient(110% 95% at 0% 0%, #FFFFFF 0%, #EBF4FE 48%, #DCEBFF 100%)',
    ambientTopClass: 'bg-[#0037c1]/15',
    ambientBottomClass: 'bg-sky-400/20',
  },

  DOCTOR: {
    role: 'DOCTOR',
    badgeLabel: 'Phân Hệ Bác Sĩ Gia Đình',
    badgeClass: 'border-emerald-200/90 bg-emerald-50 text-emerald-800',
    badgeIcon: <Stethoscope className="size-3.5 text-emerald-600" />,
    loginTitle: 'Đăng nhập Bác sĩ CCHN',
    registerTitle: 'Đăng ký Bác sĩ Gia đình',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20',
    topAccentClass: 'bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500',
    pageBackground:
      'radial-gradient(110% 95% at 0% 0%, #FFFFFF 0%, #ECFDF5 48%, #D1FAE5 100%)',
    ambientTopClass: 'bg-emerald-400/20',
    ambientBottomClass: 'bg-teal-400/15',
  },
};

interface RoleAuthShellProps {
  role: AuthTargetRole;
  mode?: 'login' | 'register';
  children: React.ReactNode;
}

export function RoleAuthShell({ role, mode = 'login', children }: RoleAuthShellProps) {
  const config = ROLE_AUTH_CONFIGS[role];
  const heading = mode === 'register' ? config.registerTitle : config.loginTitle;
  const [mainHomeHref, setMainHomeHref] = useState('/');

  useEffect(() => {
    const host = getCurrentBrowserHost();
    if (host) {
      setMainHomeHref(`${getPortalOrigin('FAMILY', host, getCurrentBrowserProto())}/`);
    }
  }, []);

  return (
    <div
      className="relative flex min-h-svh w-full items-center justify-center overflow-hidden p-4 text-foreground antialiased sm:p-6 lg:p-8"
      style={{ background: config.pageBackground }}
    >
      {/* Subtle clinical dot-grid & ambient medical accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(#94a3b8 0.85px, transparent 0.85px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -top-28 -left-28 size-96 rounded-full blur-3xl',
          config.ambientTopClass
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -right-28 -bottom-28 size-96 rounded-full blur-3xl',
          config.ambientBottomClass
        )}
      />

      {/* Centered Wide Auth Card (chuẩn @shadcn/login-03) */}
      <main className="relative z-10 w-full max-w-[500px] sm:max-w-[540px] mx-auto">
        <Card className="overflow-hidden rounded-2xl border-white/90 bg-white/95 p-0 shadow-[0_28px_70px_-18px_rgba(15,23,42,0.18)] backdrop-blur-md">
          <div className={cn('h-1.5 w-full', config.topAccentClass)} aria-hidden="true" />
          <CardContent className="space-y-6 p-7 sm:p-10">
            {/* Brand Logo căn giữa ở đầu bảng */}
            <div className="flex items-center justify-center">
              <a
                href={mainHomeHref}
                className="inline-flex items-center rounded-lg outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              >
                <img
                  src="/images/logo.png"
                  alt="FamiDoc Logo"
                  className="h-10 sm:h-12 w-auto object-contain transition-transform hover:scale-[1.03]"
                />
              </a>
            </div>

            {/* Role Badge & Heading */}
            <div className="space-y-3 text-center">
              <div className="flex justify-center">
                <Badge variant="outline" className={cn('gap-1.5 px-3 py-1 text-xs font-semibold', config.badgeClass)}>
                  {config.badgeIcon}
                  <span>{config.badgeLabel}</span>
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-foreground">
                {heading}
              </h1>
            </div>

            {/* Form Content */}
            <div>{children}</div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
