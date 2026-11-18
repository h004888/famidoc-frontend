'use client';

import { useRef, useState, type FormEvent } from 'react';
import { FilePenLine, Pill, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  medicalBooksApi,
  type BookVisitDetail,
} from '@/lib/api/medical-books.api';
import {
  prescriptionErrorMessage,
  type PrescriptionExam,
  type PrescriptionLine,
} from '@/lib/api/prescriptions.api';

const emptyExam: PrescriptionExam = {
  chiefComplaint: '',
  clinicalFindings: '',
  icd10Code: '',
  icd10Diagnosis: '',
  treatmentPlan: '',
};

const examFields: {
  name: keyof PrescriptionExam;
  label: string;
  maxLength: number;
  multiline?: boolean;
}[] = [
  {
    name: 'chiefComplaint',
    label: 'Lý do khám',
    maxLength: 4000,
    multiline: true,
  },
  {
    name: 'clinicalFindings',
    label: 'Kết quả thăm khám',
    maxLength: 4000,
    multiline: true,
  },
  { name: 'icd10Code', label: 'Mã ICD-10', maxLength: 10 },
  { name: 'icd10Diagnosis', label: 'Chẩn đoán', maxLength: 255 },
  {
    name: 'treatmentPlan',
    label: 'Kế hoạch điều trị',
    maxLength: 4000,
    multiline: true,
  },
];

type DrugRow = Record<keyof PrescriptionLine, string> & { rowId: number };
const blankDrug = (rowId: number): DrugRow => ({
  rowId,
  medicationName: '',
  strength: '',
  administrationRoute: '',
  dosage: '',
  frequency: '',
  quantity: '',
  unit: '',
  durationDays: '',
});
const drugFields: {
  name: keyof PrescriptionLine;
  label: string;
  maxLength?: number;
  max?: number;
  wide?: boolean;
}[] = [
  { name: 'medicationName', label: 'Tên thuốc', maxLength: 150, wide: true },
  { name: 'strength', label: 'Hàm lượng / nồng độ', maxLength: 50 },
  { name: 'administrationRoute', label: 'Đường dùng', maxLength: 50 },
  { name: 'dosage', label: 'Liều mỗi lần', maxLength: 50 },
  {
    name: 'frequency',
    label: 'Tần suất và thời điểm dùng',
    maxLength: 100,
    wide: true,
  },
  { name: 'durationDays', label: 'Số ngày dùng', max: 365 },
  { name: 'quantity', label: 'Tổng số lượng', max: 100000 },
  { name: 'unit', label: 'Đơn vị', maxLength: 30 },
];

export function PrescriptionForm({
  visit,
  onConfirmed,
  onPendingChange,
}: {
  visit: BookVisitDetail;
  onConfirmed: () => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  const [exam, setExam] = useState(emptyExam);
  const [includePrescription, setIncludePrescription] = useState(false);
  const [drugs, setDrugs] = useState<DrugRow[]>([blankDrug(1)]);
  const nextRowId = useRef(2);
  const [instructions, setInstructions] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const { recipient } = visit;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!authorized || pending || (includePrescription && !recipient)) return;
    if (!visit.exam && Object.values(exam).some((value) => !value.trim())) {
      setError('Vui lòng điền đầy đủ thông tin khám.');
      return;
    }
    setPending(true);
    onPendingChange?.(true);
    setError('');
    try {
      await medicalBooksApi.confirm(visit.id, {
        patientId: visit.patient.id,
        confirmed: true,
        ...(!visit.exam ? { exam } : {}),
        ...(includePrescription && recipient
          ? {
              prescription: {
                details: drugs.map(
                  ({ rowId: _rowId, quantity, durationDays, ...drug }) => ({
                    ...drug,
                    quantity: Number(quantity),
                    durationDays: Number(durationDays),
                  }),
                ),
                instructions,
                recipientUserId: recipient.id,
                recipientAuthorized: true,
              },
            }
          : {}),
      });
      onConfirmed();
    } catch (failure) {
      setError(
        prescriptionErrorMessage(
          failure,
          'Chưa xác nhận được trang khám. Vui lòng thử lại.',
        ),
      );
    } finally {
      setPending(false);
      onPendingChange?.(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <fieldset disabled={pending} className="min-w-0 space-y-5">
        {!visit.exam && (
          <Card className="gap-4 border-slate-200/80 shadow-none p-4 sm:p-6">
            <h2 className="text-lg font-semibold">Thông tin khám</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {examFields.map((field) => {
                const props = {
                  id: field.name,
                  required: true,
                  value: exam[field.name],
                  maxLength: field.maxLength,
                  onChange: (
                    event: React.ChangeEvent<
                      HTMLInputElement | HTMLTextAreaElement
                    >,
                  ) =>
                    setExam((current) => ({
                      ...current,
                      [field.name]: event.target.value,
                    })),
                };
                return (
                  <div
                    key={field.name}
                    className={
                      field.name === 'treatmentPlan'
                        ? 'space-y-2 sm:col-span-2'
                        : 'space-y-2'
                    }
                  >
                    <Label htmlFor={field.name}>{field.label}</Label>
                    {field.multiline ? (
                      <Textarea {...props} rows={2} />
                    ) : (
                      <Input {...props} />
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {!visit.prescription && (
          <Card className="gap-4 border-slate-200/80 shadow-none p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Pill size={20} className="text-teal-700" aria-hidden="true" />{' '}
                Đơn thuốc
              </h2>
              <label className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  className="size-4 accent-teal-700"
                  checked={includePrescription}
                  disabled={!recipient}
                  onChange={(event) => {
                    setIncludePrescription(event.target.checked);
                    setAuthorized(false);
                  }}
                />
                Kê đơn cho lần khám này
              </label>
            </div>
            {!recipient && (
              <p className="text-sm text-slate-600">
                Chưa có người nhận đơn thuốc hợp lệ.
              </p>
            )}
            {includePrescription && (
              <>
                {drugs.map((drug, index) => (
                  <fieldset
                    key={drug.rowId}
                    className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4"
                  >
                    <legend className="px-2 text-sm font-semibold text-slate-800">
                      Thuốc {index + 1}
                    </legend>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {drugFields.map((field) => {
                        const id = `drug-${drug.rowId}-${field.name}`;
                        return (
                          <div
                            key={id}
                            className={
                              field.wide
                                ? 'space-y-2 sm:col-span-2'
                                : 'space-y-2'
                            }
                          >
                            <Label htmlFor={id}>{field.label}</Label>
                            <Input
                              id={id}
                              required
                              type={field.max ? 'number' : 'text'}
                              min={field.max ? 1 : undefined}
                              max={field.max}
                              maxLength={field.maxLength}
                              value={drug[field.name]}
                              className="bg-white"
                              onChange={(event) => {
                                const value = event.target.value;
                                setDrugs((current) =>
                                  current.map((row) =>
                                    row.rowId === drug.rowId
                                      ? { ...row, [field.name]: value }
                                      : row,
                                  ),
                                );
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    {drugs.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="mt-3 text-red-700"
                        aria-label={`Bỏ thuốc ${index + 1}`}
                        onClick={() =>
                          setDrugs((current) =>
                            current.filter((row) => row.rowId !== drug.rowId),
                          )
                        }
                      >
                        <Trash2 size={16} /> Bỏ thuốc
                      </Button>
                    )}
                  </fieldset>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="self-start"
                  disabled={drugs.length >= 30}
                  onClick={() => {
                    const next = blankDrug(nextRowId.current++);
                    setDrugs((current) => [...current, next]);
                  }}
                >
                  <Plus size={16} /> Thêm thuốc
                </Button>
                <div className="space-y-2">
                  <Label htmlFor="prescription-instructions">Lời dặn</Label>
                  <Textarea
                    id="prescription-instructions"
                    value={instructions}
                    maxLength={4000}
                    rows={3}
                    onChange={(event) => setInstructions(event.target.value)}
                  />
                </div>
              </>
            )}
          </Card>
        )}

        <Card className="gap-4 border-teal-200 bg-teal-50/70 shadow-none p-4 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold">Xác nhận trang khám</h2>
            <p className="mt-1 text-sm text-slate-600">
              Người được khám{' '}
              <strong className="text-slate-900">
                {visit.patient.fullName}
              </strong>
            </p>
            {includePrescription && recipient && (
              <p className="mt-1 text-sm text-slate-600">
                Người nhận đơn{' '}
                <strong className="text-slate-900">{recipient.name}</strong>
              </p>
            )}
          </div>
          <label className="flex items-start gap-3 rounded-xl border border-teal-200 bg-white p-3 text-sm text-teal-950">
            <input
              type="checkbox"
              required
              className="mt-1 size-4 shrink-0 accent-teal-700"
              checked={authorized}
              onChange={(event) => setAuthorized(event.target.checked)}
            />
            <span>
              Tôi xác nhận nội dung và người được khám.
              {includePrescription &&
                ' Tôi đã kiểm tra đơn và quyền của người nhận.'}
            </span>
          </label>
          <p className="text-sm text-slate-600">
            Xác nhận nội bộ bằng tài khoản bác sĩ. Trang đã xác nhận sẽ được mở
            cho gia đình xem.
          </p>
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
            >
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={!authorized || pending}
            className="self-start bg-teal-700 hover:bg-teal-800"
          >
            <FilePenLine size={16} aria-hidden="true" />{' '}
            {pending
              ? 'Đang xác nhận…'
              : includePrescription
                ? 'Xác nhận và gửi đơn'
                : 'Xác nhận trang khám'}
          </Button>
        </Card>
      </fieldset>
    </form>
  );
}
