import { medicalBooksApi } from '@/lib/api/medical-books.api';

export async function downloadBookDocument(
  familyId: string,
  patientId: string,
  id: string,
  documentName: string,
): Promise<void> {
  const blob = await medicalBooksApi.downloadDocument(familyId, patientId, id);
  const url = URL.createObjectURL(blob);
  const extension =
    blob.type === 'application/pdf'
      ? '.pdf'
      : blob.type === 'image/png'
        ? '.png'
        : '.jpg';
  const link = document.createElement('a');
  link.href = url;
  link.download = documentName.endsWith(extension)
    ? documentName
    : documentName + extension;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
