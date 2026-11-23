import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  contractsApi,
  reviewsApi,
  supportCasesApi,
  type ComplaintItem,
  type SupportCaseDetail,
} from '@/lib/api';
import { ApiError } from '@/lib/http/errors';
import { FamilyFeedbackView } from '../family-feedback-view';

let query: URLSearchParams;
vi.mock('next/navigation', () => ({ useSearchParams: () => query }));

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    contractsApi: {
      ...actual.contractsApi,
      getMedicalContracts: vi.fn(),
    },
    reviewsApi: {
      ...actual.reviewsApi,
      listComplaints: vi.fn(),
      submitComplaint: vi.fn(),
      getComplaintById: vi.fn(),
      uploadComplaintEvidence: vi.fn(),
      submitDoctorReview: vi.fn(),
    },
    supportCasesApi: {
      ...actual.supportCasesApi,
      list: vi.fn(),
      detail: vi.fn(),
      createComplaintCase: vi.fn(),
      uploadAttachment: vi.fn(),
    },
  };
});

const contractId = '55555555-5555-4555-8555-555555555555';

const resolvedComplaint: ComplaintItem = {
  id: '99999999-9999-4999-8999-999999999999',
  complaintCode: 'CP20260001',
  contractId,
  complaintCategory: 'UNAUTHORIZED_FEE',
  description: 'Nhân sự yêu cầu thu thêm 150.000đ ngoài phạm vi gói đã ký.',
  status: 'RESOLVED',
  facilityResponse: 'CSYT đã xác minh và chấn chỉnh nhân sự trực tiếp khám.',
  facilityReviewedAt: '2026-11-20T09:00:00Z',
  resolutionOutcome: 'SERVICE_CORRECTION',
  resolutionNotes: 'Ban quản trị yêu cầu CSYT bù 01 buổi khám tại nhà cho gia đình.',
  resolvedAt: '2026-11-20T14:00:00Z',
  createdAt: '2026-11-19T08:00:00Z',
  contract: {
    contractNumber: 'HD-4P-2026-0001',
    facility: { facilityName: 'Phòng khám Đa khoa FamiDoc' },
    doctor: { doctorName: 'BS. Nguyễn Văn B' },
  },
};

describe('FamilyFeedbackView — real complaints list, detail & submission', () => {
  beforeEach(() => {
    query = new URLSearchParams();
    vi.clearAllMocks();
    vi.mocked(contractsApi.getMedicalContracts).mockResolvedValue([
      {
        id: contractId,
        contractNumber: 'HD-4P-2026-0001',
        status: 'ACTIVE',
        packageId: 'pkg-1',
        packageName: 'Gói Gia Đình An Tâm',
        packagePrice: 3600000,
        durationMonths: 12,
        familyId: 'fam-1',
        familyRepresentativeName: 'Nguyễn Văn A',
        familyRepresentativePhone: '0901234567',
        familyRepresentativeEmail: 'a@famidoc.vn',
        doctorId: 'doc-1',
        doctorName: 'BS. Nguyễn Văn B',
        assignedDoctorId: 'doc-1',
        assignedDoctorName: 'BS. Nguyễn Văn B',
        createdAt: '2026-11-01T00:00:00Z',
        signatures: {},
      },
    ]);
    vi.mocked(reviewsApi.listComplaints).mockResolvedValue({
      items: [resolvedComplaint],
      total: 1,
      page: 1,
      limit: 20,
    });
    vi.mocked(reviewsApi.getComplaintById).mockResolvedValue(resolvedComplaint);
    vi.mocked(supportCasesApi.list).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
    });
  });

  it('loads real family complaints, displays Vietnamese category & opens detail with facility response and Admin decision', async () => {
    render(<FamilyFeedbackView />);

    fireEvent.click(
      await screen.findByRole('button', { name: /Khiếu Nại & Sự Cố Dịch Vụ/ }),
    );

    expect(await screen.findByText('CP20260001')).toBeInTheDocument();
    expect(
      screen.getByText('Thu thêm phụ phí ngoài hợp đồng'),
    ).toBeInTheDocument();
    expect(screen.getByText('Điều chỉnh dịch vụ')).toBeInTheDocument();
    expect(
      screen.getByText(/Ban quản trị yêu cầu CSYT bù 01 buổi khám tại nhà/),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Xem chi tiết & kết quả' }),
    );

    const dialog = within(await screen.findByRole('dialog'));
    expect(reviewsApi.getComplaintById).toHaveBeenCalledWith(
      resolvedComplaint.id,
    );
    expect(
      await dialog.findByText('CSYT đã xác minh và chấn chỉnh nhân sự trực tiếp khám.'),
    ).toBeInTheDocument();
    expect(
      dialog.getByText(
        'Ban quản trị yêu cầu CSYT bù 01 buổi khám tại nhà cho gia đình.',
      ),
    ).toBeInTheDocument();
  });

  it('validates description length and submits a complaint using exact backend DTO categories', async () => {
    vi.mocked(reviewsApi.submitComplaint).mockResolvedValue({
      ...resolvedComplaint,
      id: '88888888-8888-4888-8888-888888888888',
      complaintCode: 'CP20260002',
      complaintCategory: 'DOCTOR_ABSENT',
      status: 'SUBMITTED',
      facilityResponse: null,
      resolutionOutcome: null,
      resolutionNotes: null,
    });

    render(<FamilyFeedbackView />);
    await waitFor(() => {
      expect(contractsApi.getMedicalContracts).toHaveBeenCalled();
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Gửi khiếu nại dịch vụ/ }),
    );
    const dialog = within(await screen.findByRole('dialog'));

    // Chặn mô tả dưới 10 ký tự trước khi gọi API
    fireEvent.change(dialog.getByLabelText(/Mô tả chi tiết sự việc/), {
      target: { value: 'Quá ngắn' },
    });
    fireEvent.click(dialog.getByRole('button', { name: 'Gửi khiếu nại' }));
    expect(dialog.getByRole('alert')).toHaveTextContent(
      'Mô tả chi tiết sự việc phải từ 10 đến 4000 ký tự.',
    );
    expect(reviewsApi.submitComplaint).not.toHaveBeenCalled();

    // Chọn đúng danh mục backend và nhập mô tả hợp lệ -> gửi API thật
    fireEvent.change(dialog.getByLabelText(/Loại sự cố \/ khiếu nại/), {
      target: { value: 'DOCTOR_ABSENT' },
    });
    fireEvent.change(dialog.getByLabelText(/Mô tả chi tiết sự việc/), {
      target: {
        value: 'Bác sĩ không đến khám theo đúng lịch hẹn sáng ngày 22/11/2026.',
      },
    });
    fireEvent.click(dialog.getByRole('button', { name: 'Gửi khiếu nại' }));

    await waitFor(() => {
      expect(reviewsApi.submitComplaint).toHaveBeenCalledWith({
        contractId,
        category: 'DOCTOR_ABSENT',
        description:
          'Bác sĩ không đến khám theo đúng lịch hẹn sáng ngày 22/11/2026.',
      });
    });
  });

  it.each(['new', 'duplicate', 'notification'])('opens the appeal via %s and retains the original decision', async (mode) => {
    const createdAppeal: SupportCaseDetail = {
      id: 'case-appeal-1',
      caseCode: 'XL-11223344',
      caseType: 'COMPLAINT_APPEAL',
      status: 'OPEN',
      familyUserId: 'fam-user-1',
      contractId,
      complaintId: resolvedComplaint.id,
      invoiceId: null,
      transactionId: null,
      contextSnapshot: {},
      resolutionSummary: null,
      resolvedAt: null,
      resolvedBy: null,
      createdAt: '2026-11-22T10:00:00Z',
      updatedAt: '2026-11-22T10:00:00Z',
      familyUser: {
        id: 'fam-user-1',
        fullName: 'Nguyễn Văn A',
        phone: '0901234567',
      },
      contract: {
        id: contractId,
        contractNumber: 'HD-4P-2026-0001',
        contractStatus: 'ACTIVE',
        facilityName: 'Phòng khám Đa khoa FamiDoc',
        doctorName: 'BS. Nguyễn Văn B',
        packageName: 'Gói Gia Đình An Tâm',
      },
      complaint: null,
      invoice: null,
      relatedTransactions: [],
      familyCanReply: true,
      remainingFamilyMessages: 1,
      messages: [
        {
          id: 'msg-appeal-1',
          caseId: 'case-appeal-1',
          senderUserId: 'fam-user-1',
          senderRole: 'FAMILY_REP',
          senderName: 'Nguyễn Văn A',
          body: 'Gia đình đề nghị xem xét lại vì có hóa đơn thu phụ phí đính kèm.',
          attachmentKeys: [],
          createdAt: '2026-11-22T10:00:00Z',
        },
      ],
    };
    vi.mocked(supportCasesApi.detail).mockResolvedValue(createdAppeal);
    if (mode === 'notification') {
      query = new URLSearchParams('supportCaseId=' + createdAppeal.id);
      render(<FamilyFeedbackView />);
      const dialog = within(await screen.findByRole('dialog'));
      expect(await dialog.findByText('XL-11223344')).toBeInTheDocument();
      expect(dialog.getByText(resolvedComplaint.resolutionNotes!)).toBeInTheDocument();
      expect(supportCasesApi.detail).toHaveBeenCalledWith(createdAppeal.id);
      return;
    }
    if (mode === 'duplicate') {
      vi.mocked(supportCasesApi.createComplaintCase).mockRejectedValueOnce(
        new ApiError('Khiếu nại đã có hồ sơ xem xét lại', 409, {
          error: { existingCaseId: createdAppeal.id },
        }),
      );
    } else {
      vi.mocked(supportCasesApi.createComplaintCase).mockResolvedValue(createdAppeal);
    }

    render(<FamilyFeedbackView />);

    fireEvent.click(
      await screen.findByRole('button', { name: /Khiếu Nại & Sự Cố Dịch Vụ/ }),
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Xem chi tiết & kết quả' }),
    );

    const dialog = within(await screen.findByRole('dialog'));
    const appealBtn = await dialog.findByRole('button', {
      name: /Yêu cầu xem xét lại/,
    });
    expect(
      dialog.getByRole('button', { name: /Gửi câu hỏi/ }),
    ).toBeInTheDocument();

    fireEvent.click(appealBtn);
    fireEvent.change(
      dialog.getByLabelText(/Lý do chưa đồng ý với kết quả xử lý/),
      {
        target: {
          value: 'Gia đình đề nghị xem xét lại vì có hóa đơn thu phụ phí đính kèm.',
        },
      },
    );
    fireEvent.click(
      dialog.getByRole('button', { name: 'Gửi yêu cầu xem xét lại' }),
    );

    await waitFor(() => {
      expect(supportCasesApi.createComplaintCase).toHaveBeenCalledWith({
        complaintId: resolvedComplaint.id,
        mode: 'APPEAL',
        message:
          'Gia đình đề nghị xem xét lại vì có hóa đơn thu phụ phí đính kèm.',
      });
    });

    expect(await dialog.findByText('XL-11223344')).toBeInTheDocument();
    if (mode === 'duplicate') {
      expect(supportCasesApi.detail).toHaveBeenCalledWith(createdAppeal.id);
    }
    // Phán quyết gốc của Admin vẫn hiển thị nguyên vẹn
    expect(
      dialog.getByText(
        'Ban quản trị yêu cầu CSYT bù 01 buổi khám tại nhà cho gia đình.',
      ),
    ).toBeInTheDocument();
  });
});
