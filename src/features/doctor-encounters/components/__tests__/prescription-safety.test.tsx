import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { BookVisitDetail } from "@/lib/api/medical-books.api";
import { prescriptionsApi } from "@/lib/api/prescriptions.api";
import { PrescriptionForm } from "../prescription-form";

vi.mock("@/lib/api/prescriptions.api", async (original) => ({
  ...(await original<typeof import("@/lib/api/prescriptions.api")>()),
  prescriptionsApi: { share: vi.fn(), replace: vi.fn() },
}));
const visit: BookVisitDetail = {
  id: "visit-1",
  encounterType: "HOME_VISIT",
  scheduledDate: "2026-11-01",
  scheduledTime: "1970-01-01T08:00:00Z",
  doctorName: "Bác sĩ",
  isFinalized: true,
  finalizedAt: "2026-11-01T01:00:00Z",
  patient: {
    id: "patient-1",
    familyId: "family-1",
    fullName: "Người bệnh",
    dateOfBirth: "1990-01-01",
    relationshipToHead: "SELF",
  },
  recipient: { id: "recipient-1", name: "Đại diện" },
  prescription: null,
  exam: {
    chiefComplaint: "Lý do",
    clinicalFindings: "Thăm khám",
    icd10Code: "I10",
    icd10Diagnosis: "Tăng huyết áp",
    treatmentPlan: "Theo dõi",
  },
};

function fill() {
  for (const [label, value] of [
    ["Nơi cư trú *", "Địa chỉ người bệnh"],
    ["Số điện thoại *", "0901234567"],
    ["Tên thuốc", "Tên thương mại"],
    ["Hoạt chất", "Hoạt chất"],
    ["Hàm lượng / nồng độ", "500mg"],
    ["Đường dùng", "Uống"],
    ["Liều mỗi lần", "1 viên"],
    ["Tần suất và thời điểm dùng", "2 lần/ngày sau ăn"],
    ["Số ngày dùng", "3"],
    ["Tổng số lượng", "6"],
    ["Đơn vị", "Viên"],
  ]) {
    fireEvent.change(screen.getByLabelText(label, { exact: true }), {
      target: { value },
    });
  }
  fireEvent.click(
    screen.getByRole("checkbox", { name: /Tôi xác nhận nội dung/ }),
  );
}
beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.useRealTimers());

it("omits a short long-term reason when every medicine is at most 30 days", async () => {
  render(<PrescriptionForm visit={visit} onConfirmed={vi.fn()} />);
  fill();
  fireEvent.change(screen.getByLabelText("Lý do kê trên 30 ngày (nếu có)"), {
    target: { value: "abc" },
  });
  fireEvent.submit(screen.getByRole("form"));
  await waitFor(() => expect(prescriptionsApi.share).toHaveBeenCalledTimes(1));
  expect(
    vi.mocked(prescriptionsApi.share).mock.calls[0][1].clinicalContext,
  ).not.toHaveProperty("longTermReason");
});

it("rejects an overlong long-term reason before calling the API", async () => {
  render(<PrescriptionForm visit={visit} onConfirmed={vi.fn()} />);
  fill();
  fireEvent.change(screen.getByLabelText("Số ngày dùng"), {
    target: { value: "90" },
  });
  fireEvent.change(screen.getByLabelText("Lý do kê trên 30 ngày (nếu có)"), {
    target: { value: "x".repeat(2001) },
  });
  fireEvent.submit(screen.getByRole("form"));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "từ 10 đến 2000 ký tự",
  );
  expect(prescriptionsApi.share).not.toHaveBeenCalled();
});

it("blocks missing residence, child information and overlong treatment before calling the API", async () => {
  const { rerender } = render(
    <PrescriptionForm visit={visit} onConfirmed={vi.fn()} />,
  );
  fireEvent.click(
    screen.getByRole("checkbox", { name: /Tôi xác nhận nội dung/ }),
  );
  fireEvent.submit(screen.getByRole("form"));
  expect(await screen.findByRole("alert")).toHaveTextContent("nơi cư trú");
  rerender(
    <PrescriptionForm
      key="child"
      visit={{
        ...visit,
        patient: {
          ...visit.patient,
          dateOfBirth: new Date().toISOString().slice(0, 10),
        },
      }}
      onConfirmed={vi.fn()}
    />,
  );
  fill();
  fireEvent.submit(screen.getByRole("form"));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Trẻ dưới 72 tháng",
  );
  expect(prescriptionsApi.share).not.toHaveBeenCalled();
});

it("requires an eligible diagnosis and reason for 90 days and rejects 365 days", async () => {
  render(<PrescriptionForm visit={visit} onConfirmed={vi.fn()} />);
  fill();
  fireEvent.change(screen.getByLabelText("Số ngày dùng"), {
    target: { value: "365" },
  });
  fireEvent.submit(screen.getByRole("form"));
  expect(await screen.findByRole("alert")).toHaveTextContent("từ 1 đến 90");
  fireEvent.change(screen.getByLabelText("Số ngày dùng"), {
    target: { value: "90" },
  });
  fireEvent.submit(screen.getByRole("form"));
  expect(await screen.findByRole("alert")).toHaveTextContent("Phụ lục VII");
  fireEvent.change(screen.getByLabelText("Lý do kê trên 30 ngày (nếu có)"), {
    target: { value: "Bệnh ổn định, theo phác đồ điều trị." },
  });
  fireEvent.submit(screen.getByRole("form"));
  await waitFor(() => expect(prescriptionsApi.share).toHaveBeenCalledTimes(1));
});

it("prefills a replacement, keeps the saved exam and sends the old ID plus reason", async () => {
  const onConfirmed = vi.fn();
  render(
    <PrescriptionForm
      visit={{
        ...visit,
        prescription: {
          id: "rx-old",
          prescriptionCode: "FMD-old",
          status: "ISSUED",
          prescribedDate: "2026-11-01",
          instructions: "Lời dặn cũ",
          clinicalContext: { address: "Địa chỉ đã lưu", phone: "0901234567" },
          details: [
            {
              id: "line-1",
              medicationName: "Tên thương mại",
              activeIngredient: "Hoạt chất",
              dosage: "1 viên",
              strength: "500mg",
              administrationRoute: "Uống",
              frequency: "Sau ăn",
              durationDays: 3,
              quantity: 6,
              unit: "Viên",
            },
          ],
        },
      }}
      isReplacement
      onConfirmed={onConfirmed}
    />,
  );
  expect(screen.queryByLabelText("Lý do khám")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Tên thuốc")).toHaveValue("Tên thương mại");
  expect(screen.getByLabelText("Nơi cư trú *")).toHaveValue("Địa chỉ đã lưu");
  fireEvent.click(
    screen.getByRole("checkbox", { name: /Tôi xác nhận nội dung/ }),
  );
  fireEvent.submit(screen.getByRole("form"));
  expect(await screen.findByRole("alert")).toHaveTextContent("Lý do thay thế");
  fireEvent.change(screen.getByLabelText("Lý do thay thế đơn *"), {
    target: { value: "Điều chỉnh sau khi đánh giá lại." },
  });
  fireEvent.submit(screen.getByRole("form"));
  await waitFor(() =>
    expect(prescriptionsApi.replace).toHaveBeenCalledWith(
      "rx-old",
      expect.objectContaining({
        replacementReason: "Điều chỉnh sau khi đánh giá lại.",
        recipientUserId: "recipient-1",
        details: [
          expect.objectContaining({
            medicationName: "Tên thương mại",
            quantity: 6,
          }),
        ],
      }),
    ),
  );
  expect(onConfirmed).toHaveBeenCalledTimes(1);
  expect(prescriptionsApi.share).not.toHaveBeenCalled();
});
