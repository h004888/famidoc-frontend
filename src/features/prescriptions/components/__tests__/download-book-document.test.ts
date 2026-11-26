import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { medicalBooksApi } from '@/lib/api/medical-books.api';
import { downloadBookDocument } from '../download-book-document';

vi.mock('@/lib/api/medical-books.api', () => ({
  medicalBooksApi: { downloadDocument: vi.fn() },
}));

describe('downloadBookDocument', () => {
  const clicked: string[] = [];

  beforeEach(() => {
    clicked.length = 0;
    vi.clearAllMocks();
    vi.useFakeTimers();
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push(this.download);
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('downloads PDF, triggers anchor click with .pdf extension, and revokes URL after 1s', async () => {
    vi.mocked(medicalBooksApi.downloadDocument).mockResolvedValueOnce(
      new Blob(['x'], { type: 'application/pdf' }),
    );

    await downloadBookDocument('fam-1', 'pat-1', 'doc-1', 'Kết quả');

    expect(medicalBooksApi.downloadDocument).toHaveBeenCalledWith(
      'fam-1',
      'pat-1',
      'doc-1',
    );
    expect(clicked).toEqual(['Kết quả.pdf']);
    vi.advanceTimersByTime(1000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:x');
  });

  it('does not duplicate .png extension when already present', async () => {
    vi.mocked(medicalBooksApi.downloadDocument).mockResolvedValueOnce(
      new Blob(['x'], { type: 'image/png' }),
    );

    await downloadBookDocument('fam-1', 'pat-1', 'doc-1', 'Ảnh.png');

    expect(clicked).toEqual(['Ảnh.png']);
  });

  it('appends .jpg for image/jpeg', async () => {
    vi.mocked(medicalBooksApi.downloadDocument).mockResolvedValueOnce(
      new Blob(['x'], { type: 'image/jpeg' }),
    );

    await downloadBookDocument('fam-1', 'pat-1', 'doc-1', 'Ảnh');

    expect(clicked).toEqual(['Ảnh.jpg']);
  });

  it('rethrows error without clicking anchor when downloadDocument rejects', async () => {
    vi.mocked(medicalBooksApi.downloadDocument).mockRejectedValueOnce(
      new Error('net'),
    );

    await expect(
      downloadBookDocument('fam-1', 'pat-1', 'doc-1', 'Kết quả'),
    ).rejects.toThrow('net');
    expect(clicked).toEqual([]);
  });
});
