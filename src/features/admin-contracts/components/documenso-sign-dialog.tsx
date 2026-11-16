'use client';

import React from 'react';
import { FileSignature } from 'lucide-react';
import { DocumensoSigningEmbed, type FourPartyContract } from '@/features/four-party-contract';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { getPartySignatureMatrix } from './contract-status-helpers';

export interface DocumensoSignDialogProps {
  contract: FourPartyContract | null;
  onClose: () => void;
  onSyncCompleted: () => void;
}

export function DocumensoSignDialog({
  contract,
  onClose,
  onSyncCompleted,
}: DocumensoSignDialogProps) {
  return (
    <Dialog open={Boolean(contract)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-slate-200 sm:max-w-3xl">
        {contract && (
          <>
            <DialogHeader className="border-b border-slate-100 pb-3">
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                <FileSignature className="h-5 w-5 text-primary" aria-hidden="true" />
                <span>Ký Hợp Đồng 4 Bên Trên Documenso — Bên D (Nền tảng)</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 tabular-nums">
                Mã HĐ: {contract.contractNumber} · Chủ hộ: {contract.familyRepresentativeName}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
              {getPartySignatureMatrix(contract).map((party) => (
                <div
                  key={party.key}
                  className={cn(
                    'rounded-xl border p-2.5',
                    party.signed
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                      : party.isAdminTurn
                        ? 'border-blue-200 bg-blue-50 text-blue-900'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                  )}
                >
                  <strong className="block">{party.roleLabel}</strong>
                  <div className="mt-0.5">
                    {party.signed ? 'Đã ký số' : party.isAdminTurn ? 'Tới lượt Admin' : 'Chờ ký'}
                  </div>
                </div>
              ))}
            </div>

            <DocumensoSigningEmbed
              contractId={contract.id}
              onSyncCompleted={(res) => {
                toast.success(
                  `Đã đồng bộ chữ ký Documenso cho ${contract.contractNumber} (${res.signedRoles.length}/4 bên).`
                );
                onSyncCompleted();
              }}
            />

            <DialogFooter className="border-t border-slate-100 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-lg text-xs font-semibold cursor-pointer"
              >
                Đóng
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
