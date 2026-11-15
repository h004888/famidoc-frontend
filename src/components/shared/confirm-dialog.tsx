'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Optional extended content slot rendered between the header and footer (alerts, summaries, inputs). */
  children?: React.ReactNode;
  /** Optional icon/media slot rendered inside the dialog header, e.g. a destructive-action icon. */
  headerIcon?: React.ReactNode;
  /** Extra classes applied to the extended content slot wrapper. */
  contentClassName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  isLoading?: boolean;
  onConfirm: () => void;
}

/**
 * Accessible confirmation dialog built on shadcn AlertDialog (Escape to dismiss, focus trapped).
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  headerIcon,
  contentClassName,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'default',
  isLoading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl border-slate-200 sm:max-w-md">
        <AlertDialogHeader>
          {headerIcon && <AlertDialogMedia className="size-12 rounded-xl bg-slate-100">{headerIcon}</AlertDialogMedia>}
          <AlertDialogTitle className="text-base font-bold text-slate-900">{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription className="text-xs leading-relaxed text-slate-600 sm:text-sm">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        {children && (
          <div data-slot="confirm-dialog-content" className={cn('text-xs text-slate-700 sm:text-sm', contentClassName)}>
            {children}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} className="rounded-xl text-xs font-semibold">
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className={cn(
              buttonVariants({ variant: variant === 'destructive' ? 'destructive' : 'default' }),
              'rounded-xl text-xs font-bold'
            )}
          >
            {isLoading ? 'Đang xử lý...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
