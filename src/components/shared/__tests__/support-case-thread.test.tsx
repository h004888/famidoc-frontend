import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  supportCasesApi,
  type SupportCaseDetail,
} from '@/lib/api/support-cases.api';
import { SupportCaseThread } from '../support-case-thread';

vi.mock('@/lib/api/support-cases.api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/support-cases.api')>();
  return {
    ...actual,
    supportCasesApi: {
      ...actual.supportCasesApi,
      postMessage: vi.fn(),
      updateStatus: vi.fn(),
      uploadAttachment: vi.fn(),
      downloadAttachmentBlob: vi.fn(),
    },
  };
});

function makeCaseDetail(
  overrides: Partial<SupportCaseDetail> = {},
): SupportCaseDetail {
  return {
    id: 'case-1',
    caseCode: 'XL-12345678',
    caseType: 'COMPLAINT_APPEAL',
    status: 'OPEN',
    familyUserId: 'fam-1',
    contractId: 'ctr-1',
    complaintId: 'cp-1',
    invoiceId: null,
    transactionId: null,
    contextSnapshot: {},
    resolutionSummary: null,
    resolvedAt: null,
    resolvedBy: null,
    createdAt: '2026-11-22T08:00:00Z',
    updatedAt: '2026-11-22T09:00:00Z',
    familyUser: {
      id: 'fam-1',
      fullName: 'Nguyễn Văn A',
      phone: '0901234567',
    },
    contract: {
      id: 'ctr-1',
      contractNumber: 'HD-2026-001',
      contractStatus: 'ACTIVE',
      facilityName: 'Phòng khám FamiCare',
      doctorName: 'BS. Trần Minh',
      packageName: 'Gói Gia Đình An Tâm',
    },
    complaint: null,
    invoice: null,
    relatedTransactions: [],
    familyCanReply: true,
    remainingFamilyMessages: 1,
    messages: [
      {
        id: 'msg-1',
        caseId: 'case-1',
        senderUserId: 'fam-1',
        senderRole: 'FAMILY_REP',
        senderName: 'Nguyễn Văn A',
        body: 'Gia đình đề nghị xem xét lại kết quả vì còn ảnh chụp chứng minh.',
        attachmentKeys: ['fam-1/support-cases/chung-tu.png'],
        createdAt: '2026-11-22T08:00:00Z',
      },
    ],
    ...overrides,
  };
}

describe('SupportCaseThread', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hiển thị thông báo anti-spam khi gia đình đã gửi đủ 2 tin liên tiếp chờ Admin', () => {
    render(
      <SupportCaseThread
        caseDetail={makeCaseDetail({
          familyCanReply: false,
          remainingFamilyMessages: 0,
        })}
        viewerRole="FAMILY_REP"
        onUpdated={vi.fn()}
      />,
    );

    expect(screen.getByText('XL-12345678')).toBeInTheDocument();
    expect(screen.getByText('Chờ Admin tiếp nhận')).toBeInTheDocument();
    expect(
      screen.getByText(/Bạn đã hết lượt gửi/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Gửi phản hồi/ }),
    ).not.toBeInTheDocument();
  });

  it('cho phép gia đình gửi bổ sung thông tin khi trạng thái là NEED_MORE_INFO', async () => {
    const onUpdated = vi.fn();
    const updatedCase = makeCaseDetail({ status: 'IN_REVIEW' });
    vi.mocked(supportCasesApi.postMessage).mockResolvedValue(updatedCase);
    vi.mocked(supportCasesApi.uploadAttachment)
      .mockResolvedValueOnce({ attachmentKey: 'receipt-key' })
      .mockResolvedValueOnce({ attachmentKey: 'statement-key' });

    render(
      <SupportCaseThread
        caseDetail={makeCaseDetail({
          status: 'NEED_MORE_INFO',
          familyCanReply: true,
          remainingFamilyMessages: 1,
        })}
        viewerRole="FAMILY_REP"
        onUpdated={onUpdated}
      />,
    );

    expect(
      screen.getByText(/Ban quản trị cần bổ sung thông tin/),
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByLabelText(/Bổ sung thông tin \/ chứng từ theo yêu cầu Admin/),
      {
        target: { value: 'Tôi gửi bổ sung tin nhắn xác nhận lịch hẹn.' },
      },
    );
    fireEvent.change(screen.getByLabelText('Đính kèm ảnh/PDF'), {
      target: {
        files: [
          new File(['png'], 'bien-lai.png', { type: 'image/png' }),
          new File(['pdf'], 'sao-ke.pdf', { type: 'application/pdf' }),
        ],
      },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Gửi bổ sung thông tin' }),
    );

    await waitFor(() => {
      expect(supportCasesApi.postMessage).toHaveBeenCalledWith('case-1', {
        body: 'Tôi gửi bổ sung tin nhắn xác nhận lịch hẹn.',
        attachmentKeys: ['receipt-key', 'statement-key'],
      });
    });
    expect(onUpdated).toHaveBeenCalledWith(updatedCase);
  });

  it('yêu cầu Admin ghi thông tin cần gia đình bổ sung', async () => {
    const updated = makeCaseDetail({ status: 'NEED_MORE_INFO' });
    vi.mocked(supportCasesApi.updateStatus).mockResolvedValue(updated);
    render(
      <SupportCaseThread caseDetail={makeCaseDetail()} viewerRole="ADMIN" onUpdated={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cần bổ sung thông tin' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cập nhật trạng thái' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/ghi rõ thông tin/);
    expect(supportCasesApi.updateStatus).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/Nội dung cần gia đình bổ sung/), {
      target: { value: 'Vui lòng gửi biên lai chuyển khoản.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cập nhật trạng thái' }));
    await waitFor(() => {
      expect(supportCasesApi.updateStatus).toHaveBeenCalledWith('case-1', {
        status: 'NEED_MORE_INFO',
        replyMessage: 'Vui lòng gửi biên lai chuyển khoản.',
      });
    });
  });

  it('cho phép Admin chốt kết quả RESOLVED khi nhập đủ kết luận xử lý', async () => {
    const onUpdated = vi.fn();
    const resolvedCase = makeCaseDetail({
      status: 'RESOLVED',
      resolutionSummary: 'Ban quản trị đã kiểm tra lại và bổ sung 01 buổi khám bù.',
    });
    vi.mocked(supportCasesApi.updateStatus).mockResolvedValue(resolvedCase);

    render(
      <SupportCaseThread
        caseDetail={makeCaseDetail({ status: 'IN_REVIEW' })}
        viewerRole="ADMIN"
        onUpdated={onUpdated}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Chốt kết quả' }));

    // Bắt buộc nhập kết luận xử lý tối thiểu 10 ký tự
    fireEvent.click(screen.getByRole('button', { name: 'Cập nhật trạng thái' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      /Vui lòng nhập kết luận xử lý/,
    );
    expect(supportCasesApi.updateStatus).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/Kết luận xử lý chính thức/), {
      target: {
        value: 'Ban quản trị đã kiểm tra lại và bổ sung 01 buổi khám bù.',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cập nhật trạng thái' }));

    await waitFor(() => {
      expect(supportCasesApi.updateStatus).toHaveBeenCalledWith('case-1', {
        status: 'RESOLVED',
        resolutionSummary:
          'Ban quản trị đã kiểm tra lại và bổ sung 01 buổi khám bù.',
      });
    });
    expect(onUpdated).toHaveBeenCalledWith(resolvedCase);
  });
});
