"use client";
import { useEffect, useState } from "react";
import { adminApi, type AdminRevenueConfig } from "@/lib/api/admin.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export const FACILITY_SHARE_MIN = 50;
export const FACILITY_SHARE_MAX = 95;

export function validateFacilityShare(value: number): string | null {
  if (!Number.isInteger(value)) return "Tỷ lệ phải là số nguyên.";
  if (value < FACILITY_SHARE_MIN || value > FACILITY_SHARE_MAX)
    return `Tỷ lệ cơ sở y tế phải trong khoảng ${FACILITY_SHARE_MIN}–${FACILITY_SHARE_MAX}%.`;
  return null;
}

const formatVnd = (value: number) =>
  `${value.toLocaleString("vi-VN")} ₫`;

export function RevenueShareCard() {
  const [config, setConfig] = useState<AdminRevenueConfig | null>(null);
  const [facilityShare, setFacilityShare] = useState(85);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    adminApi
      .revenueConfig()
      .then((data) => {
        if (!active) return;
        setConfig(data);
        setFacilityShare(data.facilityRevenueRate);
      })
      .catch(() => active && setMessage({ tone: "error", text: "Không tải được tỷ lệ doanh thu." }))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const error = validateFacilityShare(facilityShare);
  const platformShare = 100 - facilityShare;
  const dirty = config !== null && facilityShare !== config.facilityRevenueRate;
  const example = 1_000_000;

  const save = async () => {
    if (error) return;
    setSaving(true);
    setMessage(null);
    try {
      const next = await adminApi.updateRevenueConfig({
        facilityRevenueRate: facilityShare,
        platformCommissionRate: platformShare,
      });
      setConfig(next);
      setFacilityShare(next.facilityRevenueRate);
      setMessage({ tone: "ok", text: "Đã lưu tỷ lệ doanh thu." });
    } catch (e) {
      setMessage({ tone: "error", text: e instanceof Error ? e.message : "Lưu thất bại." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="gap-4 p-5" aria-labelledby="revenue-share-title">
      <div>
        <h2 id="revenue-share-title" className="text-base font-semibold">
          Tỷ lệ chia sẻ doanh thu
        </h2>
        <p className="text-sm text-muted-foreground">
          Giá trị mặc định khi tạo hợp đồng cơ sở y tế mới. Hợp đồng đã ký giữ nguyên tỷ lệ của nó.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải…</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="revenue-facility-share" className="text-sm font-medium">
              Cơ sở y tế nhận
            </label>
            <input
              type="range"
              aria-label="Thanh trượt tỷ lệ cơ sở y tế"
              min={FACILITY_SHARE_MIN}
              max={FACILITY_SHARE_MAX}
              value={Number.isNaN(facilityShare) ? FACILITY_SHARE_MIN : facilityShare}
              onChange={(e) => setFacilityShare(Number(e.target.value))}
              className="h-2 min-w-40 flex-1 cursor-pointer accent-primary"
              disabled={saving}
            />
            <Input
              id="revenue-facility-share"
              type="number"
              min={FACILITY_SHARE_MIN}
              max={FACILITY_SHARE_MAX}
              value={Number.isNaN(facilityShare) ? "" : facilityShare}
              onChange={(e) => setFacilityShare(Number(e.target.value))}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "revenue-share-error" : undefined}
              className="w-20 text-center tabular-nums"
              disabled={saving}
            />
            <span className="text-sm">%</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Cơ sở y tế</p>
              <p className="text-lg font-semibold tabular-nums">{error ? "—" : `${facilityShare}%`}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Hoa hồng nền tảng</p>
              <p className="text-lg font-semibold tabular-nums">{error ? "—" : `${platformShare}%`}</p>
            </div>
          </div>

          {!error && (
            <p className="text-sm text-muted-foreground">
              Ví dụ hóa đơn {formatVnd(example)}: cơ sở y tế nhận{" "}
              {formatVnd(example - Math.floor((example * platformShare) / 100))}, nền tảng nhận{" "}
              {formatVnd(Math.floor((example * platformShare) / 100))}.
            </p>
          )}
          {error && (
            <p id="revenue-share-error" role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={save} disabled={!dirty || Boolean(error) || saving}>
              {saving ? "Đang lưu…" : "Lưu tỷ lệ"}
            </Button>
            {dirty && (
              <Button
                variant="outline"
                onClick={() => config && setFacilityShare(config.facilityRevenueRate)}
                disabled={saving}
              >
                Hoàn tác
              </Button>
            )}
            {config?.updatedAt && (
              <span className="text-xs text-muted-foreground">
                Cập nhật lần cuối {new Date(config.updatedAt).toLocaleString("vi-VN")}
              </span>
            )}
          </div>
          {message && (
            <p
              role="status"
              className={message.tone === "ok" ? "text-sm text-green-700" : "text-sm text-destructive"}
            >
              {message.text}
            </p>
          )}
        </>
      )}
    </Card>
  );
}
