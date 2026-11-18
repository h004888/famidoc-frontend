'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { authApi, mapBackendRoleToFrontendRole } from '@/lib/api/auth.api';
import { getDefaultPathForRole, useAuth } from '../context/auth-context';
import { loginSchema, LoginRole } from '../schemas/auth.schema';
import { AuthUser } from '@/lib/auth-storage';
import { resolveReturnUrl } from '../return-url';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ROLE_AUTH_CONFIGS, AuthTargetRole } from './role-auth-shell';

interface RoleLoginFormProps {
  targetRole: AuthTargetRole;
}

export function RoleLoginForm({ targetRole }: RoleLoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { applySession } = useAuth();
  const config = ROLE_AUTH_CONFIGS[targetRole];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getEmailPlaceholder = () => {
    switch (targetRole) {
      case 'ADMIN':
        return 'admin@famidoc.vn hoặc tài khoản quản trị';
      case 'DOCTOR':
        return 'bacsi.nguyen@famidoc.vn';
      case 'FACILITY':
        return 'contact@ansinhhospital.vn hoặc email CSYT';
    }
  };

  const getEmailLabel = () => {
    switch (targetRole) {
      case 'ADMIN':
        return 'Email Quản trị viên';
      case 'DOCTOR':
        return 'Email Bác sĩ chuyên khoa';
      case 'FACILITY':
        return 'Email Cơ sở y tế / Bệnh viện';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = loginSchema.safeParse({ email: email.trim(), password, rememberMe });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const fieldName = issue.path[0]?.toString() || 'global';
        fieldErrors[fieldName] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      const data = await authApi.login({
        email: email.trim(),
        password,
        rememberMe,
      });

      const rawRole = (data.user?.role || data.role || targetRole).toUpperCase();
      const userRole = (mapBackendRoleToFrontendRole(rawRole) as LoginRole) || 'FAMILY';

      const authUser: AuthUser = {
        id: data.user?.id || 'usr-1',
        name: data.user?.fullName || email,
        email: data.user?.email || email,
        phone: data.user?.phone || '',
        role: userRole,
        avatarText: (data.user?.fullName || email).slice(0, 2).toUpperCase(),
        mustChangePassword: Boolean(data.user?.mustChangePassword),
      };

      applySession(userRole, authUser, data.accessToken, rememberMe);

      // Xử lý thông minh khi đăng nhập nhầm cổng
      const isRoleMismatch =
        (targetRole === 'ADMIN' && userRole !== 'ADMIN') ||
        (targetRole === 'DOCTOR' && userRole !== 'DOCTOR') ||
        (targetRole === 'FACILITY' && userRole !== 'FACILITY');

      if (isRoleMismatch) {
        toast.info(
          `Chào ${authUser.name}! Tài khoản của bạn thuộc vai trò ${userRole}, hệ thống đang điều hướng sang phân hệ làm việc tương ứng.`
        );
      } else {
        toast.success(`Đăng nhập thành công! Chào mừng ${authUser.name}.`);
      }

      const returnUrl = resolveReturnUrl(searchParams.get('redirect'));
      const destination = returnUrl ?? getDefaultPathForRole(userRole);
      router.replace(destination);
    } catch (err: unknown) {
      console.warn('Lỗi đăng nhập:', err);
      const rawMsg = err instanceof Error ? err.message.trim() : '';
      const isUnhelpful = !rawMsg || rawMsg.toLowerCase() === 'unauthorized' || /^API error \(\d+\)$/.test(rawMsg);
      setErrors({
        global: isUnhelpful
          ? 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.'
          : rawMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" data-purpose="role-login-form" noValidate>
      {/* Global Error Banner */}
      {errors.global && (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/5 py-2.5">
          <AlertCircle className="size-4" />
          <AlertDescription className="text-xs font-medium text-destructive">
            {errors.global}
          </AlertDescription>
        </Alert>
      )}

      {/* Trường Email / Tên đăng nhập */}
      <div className="space-y-1.5" data-purpose="field-email">
        <Label htmlFor="role-login-email" className="text-xs font-semibold text-foreground sm:text-[13px]">
          {getEmailLabel()} <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Mail
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="role-login-email"
            name="email"
            type="text"
            required
            autoComplete="username"
            aria-invalid={Boolean(errors.email)}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={getEmailPlaceholder()}
            className="h-11 rounded-xl pl-10 text-sm"
          />
        </div>
        {errors.email && (
          <p role="alert" className="text-xs font-medium text-destructive">
            {errors.email}
          </p>
        )}
      </div>

      {/* Trường Mật khẩu */}
      <div className="space-y-1.5" data-purpose="field-password">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="role-login-password" className="text-xs font-semibold text-foreground sm:text-[13px]">
            Mật khẩu <span className="text-destructive">*</span>
          </Label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            Quên mật khẩu?
          </Link>
        </div>
        <div className="relative">
          <Lock
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="role-login-password"
            name="password"
            aria-label="Mật khẩu"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="h-11 rounded-xl pl-10 pr-11 text-sm tracking-wider"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        </div>
        {errors.password && (
          <p role="alert" className="text-xs font-medium text-destructive">
            {errors.password}
          </p>
        )}
      </div>

      {/* Ghi nhớ đăng nhập */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="role-login-remember"
          checked={rememberMe}
          onCheckedChange={(checked) => setRememberMe(checked === true)}
        />
        <Label
          htmlFor="role-login-remember"
          className="cursor-pointer text-xs font-medium text-muted-foreground select-none sm:text-[13px]"
        >
          Ghi nhớ phiên đăng nhập
        </Label>
      </div>

      {/* Nút Đăng Nhập Chính */}
      <div className="pt-1" data-purpose="submit-button">
        <Button
          type="submit"
          size="lg"
          disabled={loading}
          aria-label="Đăng nhập cổng làm việc"
          className={cn(
            'h-11 w-full rounded-xl text-sm font-semibold transition-all cursor-pointer',
            config.buttonClass
          )}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Đang xác thực thông tin...</span>
            </>
          ) : (
            <>
              <span>Đăng nhập cổng làm việc</span>
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
