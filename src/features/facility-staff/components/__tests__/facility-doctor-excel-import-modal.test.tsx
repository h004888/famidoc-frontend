import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FacilityDoctorExcelImportModal } from '../facility-doctor-excel-import-modal';
import { doctorsApi } from '@/lib/api/doctors.api';

vi.mock('@/lib/api/doctors.api', () => ({
  doctorsApi: {
    downloadDoctorImportTemplate: vi.fn(),
    previewDoctorsExcelImport: vi.fn(),
    confirmDoctorsBulkImport: vi.fn(),
  },
}));

describe('FacilityDoctorExcelImportModal', () => {
  const onClose = vi.fn();
  const onImported = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    if (!URL.createObjectURL) {
      Object.defineProperty(URL, 'createObjectURL', {
        writable: true,
        value: vi.fn(() => 'blob:mock-template'),
      });
    } else {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-template');
    }
    if (!URL.revokeObjectURL) {
      Object.defineProperty(URL, 'revokeObjectURL', {
        writable: true,
        value: vi.fn(),
      });
    } else {
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    }
  });

  it('downloads template, previews 3-way classification, and confirms partial import', async () => {
    vi.mocked(doctorsApi.downloadDoctorImportTemplate).mockResolvedValueOnce(
      new Blob(['mock-xlsx'])
    );
    vi.mocked(doctorsApi.previewDoctorsExcelImport).mockResolvedValueOnce({
      summary: {
        totalReadRows: 3,
        validCount: 1,
        existingSkippedCount: 1,
        invalidCount: 1,
        maxReadRows: 100,
        maxConfirmBatch: 30,
      },
      validRows: [
        {
          rowNumber: 2,
          doctorName: 'BS. Nguyễn Văn Mới',
          email: 'moi@hospital.vn',
          phone: '0912345678',
          specialty: 'Khoa Y học Gia đình',
          academicTitle: 'BS.CKI',
          experienceYears: 5,
        },
      ],
      existingRows: [
        {
          rowNumber: 3,
          doctorName: 'BS. Trần Văn Cũ',
          email: 'cu@hospital.vn',
          phone: '0987654321',
          existingDoctorId: 'doc-old-1',
          existingDoctorName: 'BS. Trần Văn Cũ',
          existingOnboardingStatus: 'ACTIVE',
          reason: 'Đã tồn tại tại CSYT',
        },
      ],
      invalidRows: [
        {
          rowNumber: 4,
          raw: { doctorName: 'A', email: 'bad', phone: '123' },
          errors: ['Email không đúng định dạng hợp lệ'],
        },
      ],
    });
    vi.mocked(doctorsApi.confirmDoctorsBulkImport).mockResolvedValueOnce({
      summary: {
        requestedCount: 1,
        createdCount: 1,
        failedCount: 0,
        mailSentCount: 1,
        mailFailedCount: 0,
      },
      createdDoctors: [
        {
          rowNumber: 2,
          doctor: {
            id: 'doc-new-1',
            doctorName: 'BS. Nguyễn Văn Mới',
            email: 'moi@hospital.vn',
            specialty: 'Khoa Y học Gia đình',
            experienceYears: 5,
            onboardingStatus: 'PENDING_SUBMISSION',
            facilityId: 'fac-1',
          },
          mailSent: true,
        },
      ],
      failedRows: [],
    });

    render(
      <FacilityDoctorExcelImportModal
        isOpen={true}
        onClose={onClose}
        onImported={onImported}
      />
    );

    // 1. Download template
    fireEvent.click(screen.getByRole('button', { name: /Tải file mẫu/i }));
    await waitFor(() => {
      expect(doctorsApi.downloadDoctorImportTemplate).toHaveBeenCalledTimes(1);
    });

    // 2. Upload file and preview
    const fileInput = screen.getByLabelText(/Chọn file danh sách bác sĩ/i);
    const file = new File(['PK\x03\x04'], 'doctors.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /Kiểm tra & Xem trước/i }));

    await waitFor(() => {
      expect(doctorsApi.previewDoctorsExcelImport).toHaveBeenCalledWith(file);
      expect(screen.getByText('BS. Nguyễn Văn Mới')).toBeInTheDocument();
    });

    // Switch tabs to inspect existing and invalid rows
    fireEvent.click(screen.getByRole('button', { name: /Đã có tại CSYT \(1\)/i }));
    expect(screen.getByText('BS. Trần Văn Cũ')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Lỗi cần sửa \(1\)/i }));
    expect(screen.getByText(/Email không đúng định dạng hợp lệ/i)).toBeInTheDocument();

    // Confirm partial import for 1 valid doctor
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận tạo 1 bác sĩ/i }));

      await waitFor(() => {
        expect(doctorsApi.confirmDoctorsBulkImport).toHaveBeenCalledWith([
          expect.objectContaining({
            rowNumber: 2,
            doctorName: 'BS. Nguyễn Văn Mới',
            email: 'moi@hospital.vn',
            phone: '0912345678',
          }),
        ]);
        expect(onImported).toHaveBeenCalledTimes(1);
        expect(screen.getByText(/Tạo thành công/i)).toBeInTheDocument();
        expect(screen.getByText('moi@hospital.vn')).toBeInTheDocument();
      });
  });

  it('caps pre-selected valid rows at maxConfirmBatch (30) when file has more than 30 valid rows', async () => {
    const validRows = Array.from({ length: 35 }, (_, idx) => ({
      rowNumber: idx + 2,
      doctorName: `BS Số ${idx + 1}`,
      email: `bs${idx + 1}@hospital.vn`,
      phone: `0912345${String(idx).padStart(3, '0')}`,
      specialty: 'Y học gia đình',
      experienceYears: 2,
    }));

    vi.mocked(doctorsApi.previewDoctorsExcelImport).mockResolvedValueOnce({
      summary: {
        totalReadRows: 35,
        validCount: 35,
        existingSkippedCount: 0,
        invalidCount: 0,
        maxReadRows: 100,
        maxConfirmBatch: 30,
      },
      validRows,
      existingRows: [],
      invalidRows: [],
    });

    render(
      <FacilityDoctorExcelImportModal
        isOpen={true}
        onClose={onClose}
        onImported={onImported}
      />
    );

    const fileInput = screen.getByLabelText(/Chọn file danh sách bác sĩ/i);
    const file = new File(['PK\x03\x04'], 'doctors35.xlsx');
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /Kiểm tra & Xem trước/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Xác nhận tạo 30 bác sĩ/i })
      ).toBeInTheDocument();
    });

    // Attempting to check 31st row should keep count capped at 30
    const row31Checkbox = screen.getByLabelText(/Chọn dòng 32 - BS Số 31/i);
    fireEvent.click(row31Checkbox);
    expect(
      screen.getByRole('button', { name: /Xác nhận tạo 30 bác sĩ/i })
    ).toBeInTheDocument();
  });
});
