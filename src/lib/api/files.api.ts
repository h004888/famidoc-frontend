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

export const filesApi = {
  uploadFile: async (file: File, folder = 'documents'): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const res = await httpClient.upload<FileUploadResponse>('/api/v1/files/upload', formData);
      if (res && res.data && res.data.url) {
        return res.data.url;
      }
      return URL.createObjectURL(file);
    } catch {
      // Fallback cục bộ khi chưa có storage server
      return URL.createObjectURL(file);
    }
  },
};
