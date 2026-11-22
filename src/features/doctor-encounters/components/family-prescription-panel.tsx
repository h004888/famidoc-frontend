"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  medicalBooksApi,
  type BookFamily,
  type BookVisitDetail,
  type FamilyPrescriptionEntry,
} from "@/lib/api/medical-books.api";
import { prescriptionErrorMessage } from "@/lib/api/prescriptions.api";
import { PrescriptionForm } from "./prescription-form";

const vietnamDate = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Ho_Chi_Minh",
});

export function FamilyPrescriptionPanel({
  family,
  setPending,
  active = true,
}: {
  family: BookFamily;
  setPending: (pending: boolean) => void;
  active?: boolean;
}) {
  const [date, setDate] = useState(() => vietnamDate.format(new Date()));
  const [visits, setVisits] = useState<BookVisitDetail[]>([]);
  const [drafts, setDrafts] = useState<Record<string, FamilyPrescriptionEntry>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [revision, setRevision] = useState(0);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    medicalBooksApi
      .familyPrescriptionVisits(family.id, date, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setVisits(data.items);
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(
            prescriptionErrorMessage(
              cause,
              "Không tải được sổ khám gia đình. Vui lòng thử lại.",
            ),
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [family.id, date, revision, active]);

  const removeDraft = useCallback((id: string) => {
    setDrafts((current) => {
      if (!current[id]) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
    setSaved("");
  }, []);

  async function sendFamily() {
    const entries = Object.values(drafts);
    if (!entries.length || sending) return;
    setSending(true);
    setPending(true);
    setError("");
    try {
      const result = await medicalBooksApi.prescribeFamily(family.id, entries);
      setSaved(
        `Đã gửi ${result.items.length} đơn theo từng thành viên cho đại diện gia đình.`,
      );
      setDrafts({});
      setRevision((value) => value + 1);
    } catch (cause) {
      setError(
        prescriptionErrorMessage(
          cause,
          "Chưa gửi được đơn gia đình. Vui lòng tải lại và kiểm tra các lần khám.",
        ),
      );
    } finally {
      setSending(false);
      setPending(false);
    }
  }

  const staged = Object.values(drafts);
  return (
    <section className="min-w-0 space-y-4" aria-label="Kê đơn cho gia đình">
      <header className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="space-y-1">
          <h2 className="font-semibold">Đơn thuốc gia đình</h2>
          <p className="text-sm text-slate-600">
            Dùng thông tin khám đã xác nhận. Thuốc, liều dùng và lời dặn được
            ghi riêng cho từng người.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="family-prescription-date">
              Ngày khám của gia đình
            </Label>
            <Input
              id="family-prescription-date"
              type="date"
              required
              value={date}
              disabled={sending}
              onChange={(event) => {
                if (!event.target.value) return;
                setDate(event.target.value);
                setDrafts({});
                setSaved("");
              }}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={loading || sending}
            onClick={() => setRevision((value) => value + 1)}
          >
            Cập nhật sổ khám
          </Button>
        </div>
      </header>
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {saved && (
        <p
          role="status"
          className="rounded-lg bg-teal-50 p-3 text-sm text-teal-900"
        >
          {saved}
        </p>
      )}
      {loading ? (
        <p role="status" className="text-sm text-slate-600">
          Đang tổng hợp sổ khám gia đình…
        </p>
      ) : (
        <>
          {visits.length === 0 && !error && (
            <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
              Chưa có lần khám trong ngày đã chọn.
            </p>
          )}
          {visits.map((visit) => {
            const ready =
              visit.isFinalized &&
              visit.exam &&
              !visit.prescription &&
              visit.recipient;
            const draftKey = visit.id + ":" + visit.patient.id;
            return (
              <details
                key={`${date}-${draftKey}`}
                className="min-w-0 rounded-xl border border-slate-200 bg-white"
              >
                <summary className="cursor-pointer space-y-1 p-4">
                  <span className="font-semibold">
                    {visit.patient.fullName}
                  </span>
                  <span className="ml-2 text-xs text-slate-500">
                    {visit.scheduledTime.slice(11, 16)}
                  </span>
                  <p className="mt-1 text-sm text-slate-600">
                    {visit.exam?.icd10Code}{" "}
                    {visit.exam?.icd10Diagnosis || "Chưa có chẩn đoán"}
                  </p>
                  <p className="text-xs font-medium text-teal-800">
                    {visit.prescription
                      ? `Đã kê đơn · ${visit.prescription.prescriptionCode}`
                      : drafts[draftKey]
                        ? "Đã thêm vào bản tổng hợp"
                        : ready
                          ? "Sẵn sàng kê đơn"
                          : "Cần hoàn tất sổ khám và kiểm tra người nhận"}
                  </p>
                </summary>
                <div className="min-w-0 border-t border-slate-100 p-2 sm:p-3">
                  {ready ? (
                    <PrescriptionForm
                      visit={visit}
                      onConfirmed={() => undefined}
                      disabled={sending}
                      onDraftChange={() => removeDraft(draftKey)}
                      onSaveFamilyDraft={(entry) => {
                        setDrafts((current) => ({
                          ...current,
                          [draftKey]: entry,
                        }));
                        setError("");
                      }}
                    />
                  ) : visit.prescription ? (
                    <ul className="space-y-2 p-2 text-sm">
                      {visit.prescription.details.map((line) => (
                        <li key={line.id} className="break-words">
                          <strong>{line.medicationName}</strong> · {line.dosage}{" "}
                          · {line.frequency} · {line.quantity} {line.unit} ·{" "}
                          {line.durationDays} ngày
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="p-2 text-sm text-slate-600">
                      Mở sổ khám của thành viên để hoàn tất và xác nhận thông
                      tin trước khi kê đơn.
                    </p>
                  )}
                </div>
              </details>
            );
          })}
          {staged.length > 0 && (
            <section
              aria-label="Tổng hợp thuốc từng thành viên"
              className="space-y-3 rounded-xl border border-teal-200 bg-teal-50 p-4"
            >
              <h3 className="font-semibold text-teal-950">
                Kiểm tra đơn gia đình trước khi gửi
              </h3>
              {staged.map((entry) => (
                <div
                  key={entry.encounterId + ":" + entry.patientId}
                  className="space-y-2 rounded-lg bg-white p-3 text-sm"
                >
                  <h4 className="font-semibold">
                    {
                      visits.find(
                        (visit) => visit.id === entry.encounterId &&
                          visit.patient.id === entry.patientId,
                      )?.patient.fullName
                    }
                  </h4>
                  <ul className="space-y-1">
                    {entry.details.map((line, index) => (
                      <li key={index} className="break-words">
                        {line.medicationName} · {line.strength} · {line.dosage}{" "}
                        · {line.administrationRoute} · {line.frequency} ·{" "}
                        {line.quantity} {line.unit} · {line.durationDays} ngày
                      </li>
                    ))}
                  </ul>
                  {entry.instructions && (
                    <p className="whitespace-pre-wrap break-words text-slate-600">
                      Lời dặn · {entry.instructions}
                    </p>
                  )}
                </div>
              ))}
            </section>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-600">
              {staged.length} đơn theo thành viên đã sẵn sàng gửi.
            </p>
            <Button
              type="button"
              disabled={!staged.length || sending}
              onClick={() => void sendFamily()}
            >
              {sending ? "Đang gửi…" : "Gửi đơn cả gia đình"}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
