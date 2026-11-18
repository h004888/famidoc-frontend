'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DashboardPageShell } from '@/components/shared/dashboard-page-shell';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  extractErrorMessage,
  matchingApi,
  type AdminMatchingConfigDto,
  type DiscoveredSystemOneModelDto,
  type SystemOneConnectionTestDto,
} from '@/lib/api';

interface FormState {
  enabled: boolean;
  endpointUrl: string;
  modelName: string;
  questionType: 'score' | 'noul';
  apiKeyInput: string;
  clearApiKey: boolean;
  timeoutMs: string;
  maxCandidates: string;
  minFitThreshold: string;
  fitWeight: string;
  vacancyWeight: string;
}

const DEFAULT_FORM: FormState = {
  enabled: true,
  endpointUrl: 'http://localhost:11434/v1/systemone',
  modelName: 'd3:4b',
  questionType: 'score',
  apiKeyInput: '',
  clearApiKey: false,
  timeoutMs: '25000',
  maxCandidates: '10',
  minFitThreshold: '0.60',
  fitWeight: '0.70',
  vacancyWeight: '0.30',
};

function dtoToForm(dto: AdminMatchingConfigDto): FormState {
  return {
    enabled: dto.enabled,
    endpointUrl: dto.endpointUrl,
    modelName: dto.modelName,
    questionType: dto.questionType,
    apiKeyInput: '',
    clearApiKey: false,
    timeoutMs: String(dto.timeoutMs),
    maxCandidates: String(dto.maxCandidates),
    minFitThreshold: dto.minFitThreshold.toFixed(2),
    fitWeight: dto.fitWeight.toFixed(2),
    vacancyWeight: dto.vacancyWeight.toFixed(2),
  };
}

export function AdminMatchingConfigView() {
  const [savedConfig, setSavedConfig] =
    useState<AdminMatchingConfigDto | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredModels, setDiscoveredModels] = useState<
    DiscoveredSystemOneModelDto[]
  >([]);
  const [discoveryMessage, setDiscoveryMessage] = useState<string | null>(null);
  const [testResult, setTestResult] =
    useState<SystemOneConnectionTestDto | null>(null);

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await matchingApi.getAdminMatchingConfig();
      setSavedConfig(data);
      setForm(dtoToForm(data));
    } catch (err) {
      toast.error(
        extractErrorMessage(
          err,
          'Không thể tải cấu hình model System One hiện tại.',
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const weightsSum = useMemo(() => {
    const fit = Number(form.fitWeight);
    const vac = Number(form.vacancyWeight);
    if (!Number.isFinite(fit) || !Number.isFinite(vac)) return NaN;
    return Number((fit + vac).toFixed(4));
  }, [form.fitWeight, form.vacancyWeight]);

  const isWeightsValid =
    Number.isFinite(weightsSum) && Math.abs(weightsSum - 1) <= 0.01;

  const isLocalDraft = useMemo(() => {
    try {
      const host = new URL(form.endpointUrl.trim()).hostname.toLowerCase();
      return (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '::1' ||
        host === 'host.docker.internal' ||
        host.endsWith('.local')
      );
    } catch {
      return false;
    }
  }, [form.endpointUrl]);

  const applyPreset = (
    preset: 'ollama-local' | 'ollama-docker' | 'typesafe',
  ) => {
    setTestResult(null);
    if (preset === 'ollama-local') {
      setForm((prev) => ({
        ...prev,
        endpointUrl: 'http://localhost:11434/v1/systemone',
        modelName: 'd3:4b',
        questionType: 'score',
        apiKeyInput: '',
        clearApiKey: true,
        timeoutMs: '25000',
        maxCandidates: '10',
      }));
      return;
    }
    if (preset === 'ollama-docker') {
      setForm((prev) => ({
        ...prev,
        endpointUrl: 'http://host.docker.internal:11434/v1/systemone',
        modelName: 'd3:4b',
        questionType: 'score',
        apiKeyInput: '',
        clearApiKey: true,
        timeoutMs: '25000',
        maxCandidates: '10',
      }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      endpointUrl: 'https://api.typesafe.ai/v1/systemone',
      modelName: 'jev-1.14.0',
      questionType: 'score',
      clearApiKey: false,
      timeoutMs: '10000',
      maxCandidates: '15',
    }));
  };

  const handleDiscoverModels = async () => {
    setIsDiscovering(true);
    setDiscoveryMessage(null);
    try {
      const res = await matchingApi.discoverSystemOneModels(
        form.endpointUrl.trim() || undefined,
      );
      setDiscoveredModels(res.models);
      if (!res.reachable) {
        setDiscoveryMessage(
          res.message || `Không đọc được danh sách model tại ${res.origin}.`,
        );
      } else if (res.models.length === 0) {
        setDiscoveryMessage(
          `Máy chủ ${res.origin} đang hoạt động nhưng chưa có model nào được nạp.`,
        );
      } else {
        toast.success(
          `Đã tìm thấy ${res.models.length} model từ ${res.origin}.`,
        );
      }
    } catch (err) {
      setDiscoveryMessage(
        extractErrorMessage(err, 'Không thể quét danh sách model Ollama.'),
      );
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleTestConnection = async () => {
    const endpointUrl = form.endpointUrl.trim();
    const modelName = form.modelName.trim();
    const timeoutMs = Number(form.timeoutMs);

    if (!endpointUrl || !modelName) {
      toast.error(
        'Vui lòng nhập đầy đủ Endpoint URL và Tên model để kiểm tra.',
      );
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await matchingApi.testAdminMatchingConfig({
        endpointUrl,
        modelName,
        questionType: form.questionType,
        ...(form.apiKeyInput.trim() ? { apiKey: form.apiKeyInput.trim() } : {}),
        ...(form.clearApiKey ? { clearApiKey: true } : {}),
        ...(Number.isFinite(timeoutMs) && timeoutMs >= 1000
          ? { timeoutMs: Math.floor(timeoutMs) }
          : {}),
      });
      setTestResult(res);
      if (res.ok) {
        toast.success(
          `Kết nối thành công (${res.latencyMs} ms) với model ${res.resolvedModel ?? res.modelName}.`,
        );
      } else {
        toast.error(
          res.errorMessage ||
            'Endpoint không phản hồi đúng chuẩn /v1/systemone.',
        );
      }
    } catch (err) {
      toast.error(
        extractErrorMessage(err, 'Kiểm tra kết nối model System One thất bại.'),
      );
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpointUrl = form.endpointUrl.trim();
    const modelName = form.modelName.trim();
    const timeoutMs = Number(form.timeoutMs);
    const maxCandidates = Number(form.maxCandidates);
    const minFitThreshold = Number(form.minFitThreshold);
    const fitWeight = Number(form.fitWeight);
    const vacancyWeight = Number(form.vacancyWeight);

    if (!endpointUrl || !modelName) {
      toast.error('Endpoint URL và Tên model không được để trống.');
      return;
    }
    if (!isWeightsValid) {
      toast.error('Tổng trọng số độ phù hợp và độ trống slot phải bằng 1.00.');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await matchingApi.updateAdminMatchingConfig({
        enabled: form.enabled,
        endpointUrl,
        modelName,
        questionType: form.questionType,
        ...(form.apiKeyInput.trim() ? { apiKey: form.apiKeyInput.trim() } : {}),
        ...(form.clearApiKey ? { clearApiKey: true } : {}),
        timeoutMs: Math.floor(timeoutMs),
        maxCandidates: Math.floor(maxCandidates),
        minFitThreshold,
        fitWeight,
        vacancyWeight,
      });
      setSavedConfig(updated);
      setForm(dtoToForm(updated));
      toast.success(
        `Đã lưu cấu hình System One (${updated.modelName}) và áp dụng ngay cho Track B.`,
      );
    } catch (err) {
      toast.error(
        extractErrorMessage(err, 'Không thể lưu cấu hình AI Matching.'),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (savedConfig) {
      setForm(dtoToForm(savedConfig));
    } else {
      setForm(DEFAULT_FORM);
    }
    setTestResult(null);
  };

  const fitPercent = Math.max(0, Math.min(100, Math.round(Number(form.fitWeight) * 100) || 70));
  const vacPercent = Math.max(0, Math.min(100, Math.round(Number(form.vacancyWeight) * 100) || 30));

  return (
    <DashboardPageShell>
      <div data-testid="admin-matching-config-view" className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2 border-b border-slate-200/70">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-sm shrink-0">
                <span aria-hidden="true" className="material-symbols-outlined text-[24px]">psychology</span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    Cấu hình AI Matching
                  </h1>
                  {savedConfig && (
                    <Badge
                      variant="outline"
                      className={
                        savedConfig.enabled
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 font-medium'
                          : 'bg-amber-50 text-amber-700 border-amber-200/80 font-medium'
                      }
                    >
                      <span
                        className={`mr-1.5 inline-block w-2 h-2 rounded-full ${
                          savedConfig.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                        }`}
                      />
                      {savedConfig.enabled
                        ? 'Đang bật Track B AI'
                        : 'Đang tạm tắt — chuyển thẳng Hàng chờ Admin'}
                    </Badge>
                  )}
                  {savedConfig && (
                    <Badge
                      variant="outline"
                      className="border-indigo-200 bg-indigo-50/70 text-indigo-800 font-medium"
                    >
                      {savedConfig.isLocalEndpoint
                        ? 'Endpoint Cục bộ (Local)'
                        : 'Endpoint Đám mây / Từ xa'}
                    </Badge>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-3xl">
                  Quản trị model decision chuẩn{' '}
                  <code className="text-xs font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">/v1/systemone</code>
                  , tên model Ollama/Cloud, kiểu chấm điểm và công thức phân bổ trọng số 70/30 tại runtime.
                </p>
              </div>
            </div>
          </div>

          {savedConfig?.updatedAt && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 tabular-nums shrink-0 bg-white border border-slate-200/80 rounded-lg px-3 py-1.5 shadow-xs">
              <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-slate-400">schedule</span>
              <span>Cập nhật gần nhất:</span>
              <span className="font-semibold text-slate-700">
                {new Date(savedConfig.updatedAt).toLocaleString('vi-VN')}
              </span>
            </div>
          )}
        </div>

        {/* Quick Presets */}
        <Card className="border-blue-100 bg-gradient-to-r from-blue-50/60 via-indigo-50/30 to-white shadow-xs overflow-hidden">
          <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">auto_awesome</span>
              </div>
              <div className="space-y-0.5">
                <div className="text-xs sm:text-sm font-semibold text-slate-900">
                  Mẫu cấu hình nhanh chuẩn System One:
                </div>
                <p className="text-xs text-slate-500">
                  Chọn sẵn để điền nhanh thông số, sau đó bấm Kiểm tra kết nối trước khi Lưu.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyPreset('ollama-local')}
                className="bg-white hover:bg-blue-50 hover:border-blue-200 text-xs font-medium shadow-2xs transition-all"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[16px] mr-1 text-blue-600">computer</span>
                Ollama Local (d3:4b)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyPreset('ollama-docker')}
                className="bg-white hover:bg-indigo-50 hover:border-indigo-200 text-xs font-medium shadow-2xs transition-all"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[16px] mr-1 text-indigo-600">deployed_code</span>
                Ollama Docker (host.docker.internal)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyPreset('typesafe')}
                className="bg-white hover:bg-teal-50 hover:border-teal-200 text-xs font-medium shadow-2xs transition-all"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[16px] mr-1 text-teal-600">cloud</span>
                TypeSafe Cloud (jev-1.14.0)
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full md:col-span-2" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <p className="text-xs text-slate-500">
                Đang tải cấu hình System One...
              </p>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Section 1: Endpoint & Model */}
            <Card className="border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2.5 text-base font-semibold text-slate-900">
                    <span className="w-7 h-7 rounded-lg bg-blue-50 text-[#0037c1] flex items-center justify-center shrink-0">
                      <span aria-hidden="true" className="material-symbols-outlined text-[18px]">neurology</span>
                    </span>
                    <span>1. Kết nối Endpoint &amp; Model Decision (/v1/systemone)</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Hỗ trợ mọi server triển khai schema POST /v1/systemone (local hoặc cloud).
                  </CardDescription>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 shrink-0">
                  <Switch
                    id="systemone-enabled-switch"
                    checked={form.enabled}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, enabled: checked }))
                    }
                  />
                  <Label
                    htmlFor="systemone-enabled-switch"
                    className="cursor-pointer text-xs sm:text-sm font-semibold text-slate-800"
                  >
                    Kích hoạt đánh giá AI cho Track B
                  </Label>
                </div>
              </CardHeader>

              <Separator />

              <CardContent className="pt-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="systemone-endpoint-url" className="text-xs font-semibold text-slate-700">
                      Endpoint URL (chuẩn POST /v1/systemone) <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        id="systemone-endpoint-url"
                        value={form.endpointUrl}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            endpointUrl: e.target.value,
                          }))
                        }
                        placeholder="http://localhost:11434/v1/systemone"
                        className="font-mono text-xs sm:text-sm"
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDiscoverModels}
                        disabled={isDiscovering}
                        className="shrink-0 bg-white hover:bg-slate-50 text-xs font-medium"
                      >
                        <span aria-hidden="true" className="material-symbols-outlined text-[16px] mr-1.5 text-blue-600">
                          {isDiscovering ? 'sync' : 'travel_explore'}
                        </span>
                        {isDiscovering
                          ? 'Đang quét...'
                          : 'Quét model Ollama (/api/tags)'}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">
                      {isLocalDraft
                        ? 'Đang trỏ tới máy chủ cục bộ — không bắt buộc API Key.'
                        : 'Chấp nhận mọi máy chủ hỗ trợ schema System One (state string + questions map).'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="systemone-model-name" className="text-xs font-semibold text-slate-700">
                      Tên Model Decision <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="systemone-model-name"
                      value={form.modelName}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          modelName: e.target.value,
                        }))
                      }
                      placeholder="d3:4b"
                      className="font-mono text-xs sm:text-sm"
                      required
                    />
                    {discoveredModels.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-slate-500 mr-1">Gợi ý đã nạp:</span>
                        {discoveredModels.map((m) => (
                          <Button
                            key={m.name}
                            type="button"
                            size="sm"
                            variant={
                              form.modelName === m.name ? 'default' : 'outline'
                            }
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                modelName: m.name,
                              }))
                            }
                            className={`h-6 px-2 text-[11px] font-mono rounded-md ${
                              form.modelName === m.name
                                ? 'bg-blue-600 text-white'
                                : 'bg-white hover:bg-blue-50 text-slate-700'
                            }`}
                          >
                            {m.name}
                            {m.parameterSize ? ` (${m.parameterSize})` : ''}
                          </Button>
                        ))}
                      </div>
                    )}
                    {discoveryMessage && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200/80 rounded-md p-2">
                        {discoveryMessage}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="systemone-question-type" className="text-xs font-semibold text-slate-700">
                      Kiểu câu hỏi đánh giá (System One)
                    </Label>
                    <Select
                      value={form.questionType}
                      onValueChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          questionType: value as 'score' | 'noul',
                        }))
                      }
                    >
                      <SelectTrigger
                        id="systemone-question-type"
                        className="w-full bg-white text-xs sm:text-sm"
                      >
                        <SelectValue placeholder="Chọn kiểu đánh giá" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="score">
                          score — Thang 5 mức tiếng Việt (chuẩn hóa động theo legend)
                        </SelectItem>
                        <SelectItem value="noul">
                          noul — Xác suất Đúng / Không phù hợp [0.00 .. 1.00]
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">
                      Khuyến nghị dùng{' '}
                      <span className="font-semibold text-slate-700">score</span>{' '}
                      để giữ độ phân biệt nhiều bậc cho công thức xếp hạng 70/30.
                    </p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Label htmlFor="systemone-api-key" className="text-xs font-semibold text-slate-700">
                        Bearer API Key (Không bắt buộc cho Ollama local)
                      </Label>
                      <span className="text-xs text-slate-500 font-mono">
                        {form.clearApiKey
                          ? 'Sẽ xóa key và chạy chế độ không xác thực'
                          : savedConfig?.hasApiKey
                            ? `Key đang lưu (${savedConfig.apiKeySource}): ${savedConfig.apiKeyMasked}`
                            : 'Chưa cấu hình key (chế độ không xác thực)'}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        id="systemone-api-key"
                        type="password"
                        value={form.apiKeyInput}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            apiKeyInput: e.target.value,
                            clearApiKey: false,
                          }))
                        }
                        placeholder={
                          savedConfig?.hasApiKey
                            ? 'Để trống nếu giữ nguyên key đang lưu'
                            : 'Để trống khi dùng Ollama local'
                        }
                        className="font-mono text-xs sm:text-sm"
                      />
                      {savedConfig?.hasApiKey && !form.clearApiKey && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              apiKeyInput: '',
                              clearApiKey: true,
                            }))
                          }
                          className="shrink-0 text-destructive border-destructive/30 hover:bg-destructive/10 text-xs font-medium"
                        >
                          <span aria-hidden="true" className="material-symbols-outlined text-[16px] mr-1">delete</span>
                          Xóa key
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Thresholds & Weights */}
            <Card className="border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2.5 text-base font-semibold text-slate-900">
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                    <span aria-hidden="true" className="material-symbols-outlined text-[18px]">tune</span>
                  </span>
                  <span>2. Giới hạn hiệu năng &amp; Công thức xếp hạng (70/30)</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Điều chỉnh giới hạn timeout, số ứng viên gửi mỗi phiên và trọng số cân bằng tải đối tác.
                </CardDescription>
              </CardHeader>

              <Separator />

              <CardContent className="pt-6 space-y-6">
                {/* Visual Ratio Indicator */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between text-xs font-medium gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                      <span className="font-semibold text-slate-800">
                        Độ phù hợp Model AI: {fitPercent}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" />
                      <span className="font-semibold text-slate-800">
                        Độ trống Slot / Cân bằng tải: {vacPercent}%
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium tabular-nums ${
                        isWeightsValid
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-destructive/40 bg-destructive/10 text-destructive'
                      }`}
                    >
                      Tổng: {Number.isFinite(weightsSum) ? weightsSum.toFixed(2) : '—'} / 1.00{' '}
                      {isWeightsValid ? '✅' : '⚠️'}
                    </Badge>
                  </div>

                  {/* Dual ProgressBar */}
                  <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
                      style={{ width: `${fitPercent}%` }}
                      title={`Độ phù hợp AI: ${fitPercent}%`}
                    />
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300"
                      style={{ width: `${vacPercent}%` }}
                      title={`Độ trống slot: ${vacPercent}%`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="space-y-1.5 rounded-lg border border-slate-100 bg-white p-3 shadow-2xs">
                    <Label htmlFor="systemone-timeout" className="text-xs font-semibold text-slate-700">
                      Timeout (ms)
                    </Label>
                    <Input
                      id="systemone-timeout"
                      type="number"
                      min={1000}
                      max={120000}
                      step={500}
                      value={form.timeoutMs}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          timeoutMs: e.target.value,
                        }))
                      }
                      className="tabular-nums font-mono text-xs sm:text-sm"
                    />
                    <p className="text-[11px] text-slate-500">
                      Local nên đặt 20000–30000
                    </p>
                  </div>

                  <div className="space-y-1.5 rounded-lg border border-slate-100 bg-white p-3 shadow-2xs">
                    <Label htmlFor="systemone-max-candidates" className="text-xs font-semibold text-slate-700">
                      Ứng viên tối đa / lượt
                    </Label>
                    <Input
                      id="systemone-max-candidates"
                      type="number"
                      min={1}
                      max={30}
                      value={form.maxCandidates}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          maxCandidates: e.target.value,
                        }))
                      }
                      className="tabular-nums font-mono text-xs sm:text-sm"
                    />
                    <p className="text-[11px] text-slate-500">
                      Khuyến nghị 8–10 cho local
                    </p>
                  </div>

                  <div className="space-y-1.5 rounded-lg border border-slate-100 bg-white p-3 shadow-2xs">
                    <Label htmlFor="systemone-min-fit" className="text-xs font-semibold text-slate-700">
                      Ngưỡng phù hợp tối thiểu
                    </Label>
                    <Input
                      id="systemone-min-fit"
                      type="number"
                      min={0}
                      max={1}
                      step={0.05}
                      value={form.minFitThreshold}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          minFitThreshold: e.target.value,
                        }))
                      }
                      className="tabular-nums font-mono text-xs sm:text-sm"
                    />
                    <p className="text-[11px] text-slate-500">
                      Dưới ngưỡng vào Hàng chờ Admin
                    </p>
                  </div>

                  <div className="space-y-1.5 rounded-lg border border-blue-100 bg-blue-50/30 p-3 shadow-2xs">
                    <Label htmlFor="systemone-fit-weight" className="text-xs font-semibold text-blue-900">
                      Trọng số điểm Model
                    </Label>
                    <Input
                      id="systemone-fit-weight"
                      type="number"
                      min={0}
                      max={1}
                      step={0.05}
                      value={form.fitWeight}
                      onChange={(e) => {
                        const v = e.target.value;
                        const num = Number(v);
                        setForm((prev) => ({
                          ...prev,
                          fitWeight: v,
                          ...(Number.isFinite(num) && num >= 0 && num <= 1
                            ? { vacancyWeight: (1 - num).toFixed(2) }
                            : {}),
                        }));
                      }}
                      className="tabular-nums font-mono text-xs sm:text-sm font-semibold text-blue-700"
                    />
                    <p className="text-[11px] text-blue-700/80">Mặc định 0.70</p>
                  </div>

                  <div className="space-y-1.5 rounded-lg border border-teal-100 bg-teal-50/30 p-3 shadow-2xs">
                    <Label htmlFor="systemone-vacancy-weight" className="text-xs font-semibold text-teal-900">
                      Trọng số độ trống slot
                    </Label>
                    <Input
                      id="systemone-vacancy-weight"
                      type="number"
                      min={0}
                      max={1}
                      step={0.05}
                      value={form.vacancyWeight}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          vacancyWeight: e.target.value,
                        }))
                      }
                      className="tabular-nums font-mono text-xs sm:text-sm font-semibold text-teal-700"
                    />
                    <p
                      className={`text-[11px] tabular-nums ${
                        isWeightsValid
                          ? 'text-teal-700/80'
                          : 'text-destructive font-semibold'
                      }`}
                    >
                      Tổng 2 trọng số:{' '}
                      {Number.isFinite(weightsSum)
                        ? weightsSum.toFixed(2)
                        : '—'}{' '}
                      (cần 1.00)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Dry-run Connection Test */}
            <Card className="border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2.5 text-base font-semibold text-slate-900">
                    <span className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                      <span aria-hidden="true" className="material-symbols-outlined text-[18px]">science</span>
                    </span>
                    <span>3. Kiểm tra kết nối &amp; Test thử chuẩn /v1/systemone</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Gửi 2 hồ sơ bác sĩ giả lập (1 khớp chuyên khoa Tim mạch Quận 1, 1 lệch chuyên khoa) theo thông số đang nhập trước khi lưu.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="border-[#0037c1]/40 text-[#00258b] bg-blue-50/40 hover:bg-blue-100/60 font-semibold text-xs shrink-0 shadow-2xs"
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-[16px] mr-1.5 text-[#0037c1]">
                    {isTesting ? 'sync' : 'network_check'}
                  </span>
                  {isTesting
                    ? 'Đang gọi thử /v1/systemone...'
                    : 'Kiểm tra kết nối & Test thử'}
                </Button>
              </CardHeader>

              {testResult && (
                <>
                  <Separator />
                  <CardContent className="pt-5">
                    <Alert
                      data-testid="systemone-test-result"
                      variant={testResult.ok ? 'default' : 'destructive'}
                      className={
                        testResult.ok
                          ? 'border-emerald-200 bg-emerald-50/80 text-emerald-950 rounded-xl'
                          : 'border-destructive/40 bg-destructive/5 rounded-xl'
                      }
                    >
                      <div className="col-span-full space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-emerald-600">
                              {testResult.ok ? 'check_circle' : 'error'}
                            </span>
                            <AlertTitle className="mb-0 font-semibold text-sm">
                              {testResult.ok
                                ? 'Tương thích chuẩn System One — Phản hồi hợp lệ'
                                : 'Kiểm tra kết nối thất bại'}
                            </AlertTitle>
                            {testResult.httpStatus !== null && (
                              <Badge
                                variant="outline"
                                className="tabular-nums bg-white font-mono text-[11px]"
                              >
                                HTTP {testResult.httpStatus}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-600 tabular-nums">
                            <span>
                              Model phản hồi:{' '}
                              <strong className="font-semibold text-slate-900 font-mono">
                                {testResult.resolvedModel ?? testResult.modelName}
                              </strong>
                            </span>
                            <span>
                              Độ trễ:{' '}
                              <strong className="font-semibold text-slate-900 font-mono">
                                {testResult.latencyMs} ms
                              </strong>
                            </span>
                          </div>
                        </div>

                        {testResult.errorMessage && (
                          <AlertDescription className="text-destructive text-xs">
                            {testResult.errorMessage}
                          </AlertDescription>
                        )}

                        {testResult.sampleScores.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            {testResult.sampleScores.map((s) => {
                              const scorePercent = Math.round(s.fitScore * 100);
                              return (
                                <div
                                  key={s.doctorId}
                                  className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs flex flex-col justify-between gap-2.5"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="text-xs text-slate-700 space-y-0.5">
                                      <div className="font-semibold text-slate-900">
                                        {s.label}
                                      </div>
                                      {s.confidence !== undefined && (
                                        <div className="text-slate-500 tabular-nums text-[11px]">
                                          Độ tự tin: {(s.confidence * 100).toFixed(1)}%
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right tabular-nums shrink-0">
                                      <span className="text-base font-bold text-[#00258b] font-mono">
                                        {s.fitScore.toFixed(4)}
                                      </span>
                                      <div className="text-[10px] text-slate-400">
                                        Thang [0..1]
                                      </div>
                                    </div>
                                  </div>

                                  {/* Score Mini Bar */}
                                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        s.fitScore >= 0.6
                                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                                          : 'bg-amber-400'
                                      }`}
                                      style={{ width: `${scorePercent}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </Alert>
                  </CardContent>
                </>
              )}

              <CardFooter className="border-t border-slate-100 bg-slate-50/70 py-4 px-6 flex flex-wrap items-center justify-end gap-3 rounded-b-xl">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={isSaving}
                  className="bg-white hover:bg-slate-50 text-xs font-medium"
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-[16px] mr-1 text-slate-500">undo</span>
                  Khôi phục giá trị đã lưu
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving || !isWeightsValid}
                  className="bg-[#0037c1] hover:bg-[#00258b] text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-[16px] mr-1.5">save</span>
                  {isSaving ? 'Đang lưu cấu hình...' : 'Lưu cấu hình'}
                </Button>
              </CardFooter>
            </Card>
          </form>
        )}
      </div>
    </DashboardPageShell>
  );
}
