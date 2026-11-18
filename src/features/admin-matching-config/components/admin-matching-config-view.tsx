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

  return (
    <DashboardPageShell>
      <div data-testid="admin-matching-config-view" className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Cấu Hình Model Decision (Chuẩn System One)
              </h1>
              {savedConfig && (
                <Badge
                  variant={savedConfig.enabled ? 'default' : 'secondary'}
                  className={
                    savedConfig.enabled
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
                      : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }
                >
                  {savedConfig.enabled
                    ? 'Đang bật Track B AI'
                    : 'Đang tạm tắt — chuyển thẳng Hàng chờ Admin'}
                </Badge>
              )}
              {savedConfig && (
                <Badge
                  variant="outline"
                  className="border-indigo-200 bg-indigo-50/70 text-indigo-800"
                >
                  {savedConfig.isLocalEndpoint
                    ? 'Endpoint Cục bộ (Local)'
                    : 'Endpoint Đám mây / Từ xa'}
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl">
              Tùy biến endpoint{' '}
              <span className="font-medium text-slate-800">/v1/systemone</span>,
              tên model (như Ollama{' '}
              <span className="font-medium text-slate-800">d3:4b</span> hoặc
              TypeSafe Cloud), kiểu chấm điểm và trọng số 70/30 tại runtime mà
              không cần khởi động lại máy chủ.
            </p>
          </div>

          {savedConfig?.updatedAt && (
            <div className="text-xs text-slate-500 tabular-nums shrink-0">
              Cập nhật gần nhất:{' '}
              <span className="font-medium text-slate-700">
                {new Date(savedConfig.updatedAt).toLocaleString('vi-VN')}
              </span>
            </div>
          )}
        </div>

        {/* Quick Presets */}
        <Card className="border-slate-200/80 bg-[#f2f3ff]/70 shadow-xs">
          <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs text-slate-700">
              <span className="font-semibold text-[#00258b]">
                Mẫu cấu hình nhanh chuẩn System One:
              </span>{' '}
              Chọn sẵn để điền nhanh thông số, sau đó bấm Kiểm tra kết nối
              trước khi Lưu.
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyPreset('ollama-local')}
                className="bg-white"
              >
                Ollama Local (d3:4b)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyPreset('ollama-docker')}
                className="bg-white"
              >
                Ollama Docker (host.docker.internal)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyPreset('typesafe')}
                className="bg-white"
              >
                TypeSafe Cloud (jev-1.14.0)
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card className="border-slate-200/80 shadow-xs">
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
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    <span className="material-symbols-outlined text-[20px] text-[#0037c1]">
                      neurology
                    </span>
                    <span>
                      1. Kết nối Endpoint &amp; Model Decision (/v1/systemone)
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Hỗ trợ mọi server triển khai schema POST /v1/systemone (local
                    hoặc cloud).
                  </CardDescription>
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
                  <Switch
                    id="systemone-enabled-switch"
                    checked={form.enabled}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, enabled: checked }))
                    }
                  />
                  <Label
                    htmlFor="systemone-enabled-switch"
                    className="cursor-pointer text-sm font-medium text-slate-800"
                  >
                    Kích hoạt đánh giá AI cho Track B
                  </Label>
                </div>
              </CardHeader>

              <Separator />

              <CardContent className="pt-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="systemone-endpoint-url">
                      Endpoint URL (chuẩn POST /v1/systemone)
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
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDiscoverModels}
                        disabled={isDiscovering}
                        className="shrink-0"
                      >
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
                    <Label htmlFor="systemone-model-name">
                      Tên Model Decision
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
                      required
                    />
                    {discoveredModels.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
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
                            className="h-7 px-2.5 text-xs"
                          >
                            {m.name}
                            {m.parameterSize ? ` (${m.parameterSize})` : ''}
                          </Button>
                        ))}
                      </div>
                    )}
                    {discoveryMessage && (
                      <p className="text-xs text-amber-700">
                        {discoveryMessage}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="systemone-question-type">
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
                        className="w-full"
                      >
                        <SelectValue placeholder="Chọn kiểu đánh giá" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="score">
                          score — Thang 5 mức tiếng Việt (chuẩn hóa động theo
                          legend)
                        </SelectItem>
                        <SelectItem value="noul">
                          noul — Xác suất Đúng / Không phù hợp [0.00 .. 1.00]
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">
                      Khuyến nghị dùng{' '}
                      <span className="font-medium text-slate-700">score</span>{' '}
                      để giữ độ phân biệt nhiều bậc cho công thức xếp hạng
                      70/30.
                    </p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Label htmlFor="systemone-api-key">
                        Bearer API Key (Không bắt buộc cho Ollama local)
                      </Label>
                      <span className="text-xs text-slate-500">
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
                          className="shrink-0 text-destructive border-destructive/30 hover:bg-destructive/10"
                        >
                          Xóa key
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Thresholds & Weights */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <span className="material-symbols-outlined text-[20px] text-[#0037c1]">
                    tune
                  </span>
                  <span>
                    2. Giới hạn hiệu năng &amp; Công thức xếp hạng (70/30)
                  </span>
                </CardTitle>
                <CardDescription>
                  Điều chỉnh giới hạn timeout, số ứng viên gửi mỗi phiên và
                  trọng số cân bằng tải đối tác.
                </CardDescription>
              </CardHeader>

              <Separator />

              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="systemone-timeout">Timeout (ms)</Label>
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
                      className="tabular-nums"
                    />
                    <p className="text-[11px] text-slate-500">
                      Local nên đặt 20000–30000
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="systemone-max-candidates">
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
                      className="tabular-nums"
                    />
                    <p className="text-[11px] text-slate-500">
                      Khuyến nghị 8–10 cho local
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="systemone-min-fit">
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
                      className="tabular-nums"
                    />
                    <p className="text-[11px] text-slate-500">
                      Dưới ngưỡng vào Hàng chờ Admin
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="systemone-fit-weight">
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
                      className="tabular-nums"
                    />
                    <p className="text-[11px] text-slate-500">Mặc định 0.70</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="systemone-vacancy-weight">
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
                      className="tabular-nums"
                    />
                    <p
                      className={`text-[11px] tabular-nums ${
                        isWeightsValid
                          ? 'text-slate-500'
                          : 'text-destructive font-medium'
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
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    <span className="material-symbols-outlined text-[20px] text-[#0037c1]">
                      science
                    </span>
                    <span>
                      3. Kiểm tra kết nối &amp; Test thử chuẩn /v1/systemone
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Gửi 2 hồ sơ bác sĩ giả lập (1 khớp chuyên khoa Tim mạch Quận
                    1, 1 lệch chuyên khoa) theo thông số đang nhập trước khi
                    lưu.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="border-[#0037c1]/30 text-[#00258b] hover:bg-indigo-50 shrink-0"
                >
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
                          ? 'border-emerald-200 bg-emerald-50/60 text-emerald-950'
                          : 'border-destructive/40 bg-destructive/5'
                      }
                    >
                      <div className="col-span-full space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <AlertTitle className="mb-0 font-semibold">
                              {testResult.ok
                                ? 'Tương thích chuẩn System One — Phản hồi hợp lệ'
                                : 'Kiểm tra kết nối thất bại'}
                            </AlertTitle>
                            {testResult.httpStatus !== null && (
                              <Badge
                                variant="outline"
                                className="tabular-nums bg-white"
                              >
                                HTTP {testResult.httpStatus}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-600 tabular-nums">
                            <span>
                              Model phản hồi:{' '}
                              <strong className="font-semibold text-slate-900">
                                {testResult.resolvedModel ??
                                  testResult.modelName}
                              </strong>
                            </span>
                            <span>
                              Độ trễ:{' '}
                              <strong className="font-semibold text-slate-900">
                                {testResult.latencyMs} ms
                              </strong>
                            </span>
                          </div>
                        </div>

                        {testResult.errorMessage && (
                          <AlertDescription className="text-destructive">
                            {testResult.errorMessage}
                          </AlertDescription>
                        )}

                        {testResult.sampleScores.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {testResult.sampleScores.map((s) => (
                              <div
                                key={s.doctorId}
                                className="rounded-lg border border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-3"
                              >
                                <div className="text-xs text-slate-700 space-y-0.5">
                                  <div className="font-semibold text-slate-900">
                                    {s.label}
                                  </div>
                                  {s.confidence !== undefined && (
                                    <div className="text-slate-500 tabular-nums">
                                      Độ tự tin:{' '}
                                      {(s.confidence * 100).toFixed(1)}%
                                    </div>
                                  )}
                                </div>
                                <div className="text-right tabular-nums shrink-0">
                                  <span className="text-base font-bold text-[#00258b]">
                                    {s.fitScore.toFixed(4)}
                                  </span>
                                  <div className="text-[11px] text-slate-500">
                                    Điểm chuẩn hóa [0..1]
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </Alert>
                  </CardContent>
                </>
              )}

              <CardFooter className="border-t border-slate-100 bg-slate-50/40 py-4 flex flex-wrap items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={isSaving}
                >
                  Khôi phục giá trị đã lưu
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving || !isWeightsValid}
                  className="bg-[#0037c1] hover:bg-[#00258b] text-white"
                >
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
