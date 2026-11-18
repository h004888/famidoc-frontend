import { httpClient } from './http-client';

export interface FileUploadResponse {
  statusCode?: number;
  message?: string;
  data: {
    url: string;
    fileName: string;
    fileSize?: number;
    mimeType?: string;
    uploadedAt?: string;
  };
}

export interface UploadedFileResult {
  url: string;
  isLocalFallback: boolean;
}

export const filesApi = {
  uploadFileWithMeta: async (file: File, folder = 'documents'): Promise<UploadedFileResult> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const res = await httpClient.upload<FileUploadResponse>('/api/v1/files/upload', formData);
      const uploadedUrl = res?.data?.url?.trim();
      if (uploadedUrl && /^https?:\/\//i.test(uploadedUrl)) {
        return { url: uploadedUrl, isLocalFallback: false };
      }
      return { url: URL.createObjectURL(file), isLocalFallback: true };
    } catch {
      // Fallback cục bộ khi chưa có endpoint upload S3 trên backend
      return { url: URL.createObjectURL(file), isLocalFallback: true };
    }
  },

  uploadFile: async (file: File, folder = 'documents'): Promise<string> => {
    const result = await filesApi.uploadFileWithMeta(file, folder);
    return result.url;
  },
};
