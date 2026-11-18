import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminMatchingConfigView } from '../admin-matching-config-view';
import { matchingApi } from '@/lib/api';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api');
  return {
    ...actual,
    matchingApi: {
      ...actual.matchingApi,
      getAdminMatchingConfig: vi.fn(),
      updateAdminMatchingConfig: vi.fn(),
      testAdminMatchingConfig: vi.fn(),
      discoverSystemOneModels: vi.fn(),
    },
  };
});

describe('AdminMatchingConfigView (Task 6.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(matchingApi.getAdminMatchingConfig).mockResolvedValue({
      enabled: true,
      endpointUrl: 'https://api.typesafe.ai/v1/systemone',
      modelName: 'jev-1.14.0',
      questionType: 'score',
      hasApiKey: true,
      apiKeyMasked: 'ts_****1234',
      apiKeySource: 'env',
      isLocalEndpoint: false,
      timeoutMs: 10000,
      maxCandidates: 15,
      minFitThreshold: 0.6,
      fitWeight: 0.7,
      vacancyWeight: 0.3,
      updatedAt: null,
    });
  });

  it('loads current config, applies Ollama local preset, tests /v1/systemone connection, and saves updated settings', async () => {
    vi.mocked(matchingApi.testAdminMatchingConfig).mockResolvedValue({
      ok: true,
      httpStatus: 200,
      latencyMs: 1840,
      endpointUrl: 'http://localhost:11434/v1/systemone',
      modelName: 'd3:4b',
      resolvedModel: 'd3:4b',
      questionType: 'score',
      sampleScores: [
        {
          doctorId: 'doc-match',
          label: 'Mẫu khớp cao (Tim mạch, Quận 1)',
          fitScore: 0.985,
          confidence: 0.91,
        },
        {
          doctorId: 'doc-mismatch',
          label: 'Mẫu lệch chuyên khoa (Da liễu, Củ Chi)',
          fitScore: 0.06,
          confidence: 0.93,
        },
      ],
    });

    vi.mocked(matchingApi.updateAdminMatchingConfig).mockResolvedValue({
      enabled: true,
      endpointUrl: 'http://localhost:11434/v1/systemone',
      modelName: 'd3:4b',
      questionType: 'score',
      hasApiKey: false,
      apiKeyMasked: null,
      apiKeySource: 'none',
      isLocalEndpoint: true,
      timeoutMs: 25000,
      maxCandidates: 10,
      minFitThreshold: 0.6,
      fitWeight: 0.7,
      vacancyWeight: 0.3,
      updatedAt: '2026-11-18T04:15:00.000Z',
    });

    render(<AdminMatchingConfigView />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('jev-1.14.0')).toBeInTheDocument();
    });
    expect(screen.getByText(/ts_\*\*\*\*1234/)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Ollama Local (d3:4b)' }),
    );
    expect(
      screen.getByDisplayValue('http://localhost:11434/v1/systemone'),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('d3:4b')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Kiểm tra kết nối & Test thử' }),
    );

    await waitFor(() => {
      expect(matchingApi.testAdminMatchingConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          endpointUrl: 'http://localhost:11434/v1/systemone',
          modelName: 'd3:4b',
          questionType: 'score',
          clearApiKey: true,
        }),
      );
      expect(screen.getByTestId('systemone-test-result')).toBeInTheDocument();
      expect(screen.getByText(/1840 ms/)).toBeInTheDocument();
      expect(screen.getByText('0.9850')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Lưu cấu hình' }));

    await waitFor(() => {
      expect(matchingApi.updateAdminMatchingConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          endpointUrl: 'http://localhost:11434/v1/systemone',
          modelName: 'd3:4b',
          clearApiKey: true,
          timeoutMs: 25000,
          maxCandidates: 10,
        }),
      );
    });
  });
});
