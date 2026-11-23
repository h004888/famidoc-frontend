import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { expect, it, vi } from "vitest";
import {
  medicalBooksApi,
  type BookFamily,
  type BookVisitDetail,
} from "@/lib/api/medical-books.api";
import { FamilyPrescriptionPanel } from "../family-prescription-panel";

vi.mock("@/lib/api/medical-books.api", () => ({
  medicalBooksApi: {
    familyPrescriptionVisits: vi.fn(),
    prescribeFamily: vi.fn(),
  },
}));
const family: BookFamily = {
  id: "family-1",
  representativeName: "Đại diện gia đình",
  members: [],
};
const makeVisit = (index: number, encounterId: string): BookVisitDetail => ({
  id: encounterId,
  encounterType: "HOME_VISIT",
  scheduledDate: "2026-11-20",
  scheduledTime: "1970-01-01T08:00:00Z",
  doctorName: "Bác sĩ điều trị",
  isFinalized: true,
  finalizedAt: "2026-11-20T01:00:00Z",
  patient: {
    id: `patient-${index}`,
    familyId: family.id,
    fullName: `Người ${index}`,
    dateOfBirth: "1990-01-01",
    relationshipToHead: "SELF",
  },
  exam: {
    chiefComplaint: "Lý do đã lưu",
    clinicalFindings: "Kết quả đã lưu",
    icd10Code: `Z0${index}`,
    icd10Diagnosis: `Chẩn đoán ${index}`,
    treatmentPlan: "Điều trị đã lưu",
  },
  recipient: { id: "recipient-1", name: family.representativeName },
  prescription: null,
});

it.each([false, true])("sends each member their own prescription (same visit: %s)", async (sameVisit) => {
  const encounterId = (index: number) => "visit-" + (sameVisit ? 1 : index);
  vi.mocked(medicalBooksApi.familyPrescriptionVisits).mockResolvedValue({
    items: [1, 2].map((index) => makeVisit(index, encounterId(index))),
  });
  vi.mocked(medicalBooksApi.prescribeFamily).mockClear();
  vi.mocked(medicalBooksApi.prescribeFamily).mockResolvedValue({
    familyId: family.id,
    items: [1, 2].map((index) => ({
      id: `rx-${index}`,
      prescriptionCode: `RX-${index}`,
      patientId: `patient-${index}`,
      encounterId: encounterId(index),
    })),
  });
  const { container } = render(
    <FamilyPrescriptionPanel family={family} setPending={vi.fn()} />,
  );
  await screen.findByText("Người 1", { selector: "summary span" });
  expect(
    screen.getByRole("button", { name: "Gửi đơn cả gia đình" }),
  ).toBeDisabled();
  for (const index of [1, 2]) {
    fireEvent.click(
      screen
        .getByText(`Người ${index}`, { selector: "summary span" })
        .closest("summary")!,
    );
    const form = within(
      screen.getByRole("form", { name: `Kê đơn cho Người ${index}` }),
    );
    expect(form.queryByLabelText("Lý do khám")).not.toBeInTheDocument();
    expect(form.getByText(`Chẩn đoán ${index}`)).toBeInTheDocument();
    for (const [label, value] of [
      ["Tên thuốc", `Thuốc của người ${index}`],
      ["Hoạt chất", "Hoạt chất mẫu"],
      ["Nơi cư trú *", "Địa chỉ người bệnh"],
      ["Số điện thoại *", "0901234567"],
      ["Hàm lượng / nồng độ", "500mg"],
      ["Đường dùng", "Uống"],
      ["Liều mỗi lần", `${index} viên`],
      ["Tần suất và thời điểm dùng", "Sau ăn"],
      ["Số ngày dùng", "3"],
      ["Tổng số lượng", String(index * 3)],
      ["Đơn vị", "Viên"],
    ])
      fireEvent.change(form.getByLabelText(label), { target: { value } });
    fireEvent.click(
      form.getByRole("checkbox", { name: /Tôi xác nhận nội dung/ }),
    );
    fireEvent.click(
      form.getByRole("button", { name: "Thêm vào đơn gia đình" }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("region", { name: "Tổng hợp thuốc từng thành viên" }),
      ).toHaveTextContent(`Thuốc của người ${index}`),
    );
  }
  expect(medicalBooksApi.prescribeFamily).not.toHaveBeenCalled();
  const ids = [...container.querySelectorAll("[id]")].map(
    (element) => element.id,
  );
  expect(new Set(ids).size).toBe(ids.length);
  expect(container.querySelector('[class*="min-w-[1000px]"]')).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Gửi đơn cả gia đình" }));
  await waitFor(() =>
    expect(medicalBooksApi.prescribeFamily).toHaveBeenCalledWith(
      family.id,
      [1, 2].map((index) =>
        expect.objectContaining({
          patientId: `patient-${index}`,
          encounterId: encounterId(index),
          details: [
            expect.objectContaining({
              medicationName: `Thuốc của người ${index}`,
              dosage: `${index} viên`,
              quantity: index * 3,
            }),
          ],
        }),
      ),
    ),
  );
  expect(
    await screen.findByText(
      "Đã gửi 2 đơn theo từng thành viên cho đại diện gia đình.",
    ),
  ).toBeInTheDocument();
});
