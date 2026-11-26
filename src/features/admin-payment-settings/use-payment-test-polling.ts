"use client";
import { useEffect, useRef, useState } from "react";
import {
  paymentSettingsApi,
  type PaymentTestSession,
} from "@/lib/api/payment-settings.api";

function displaySession(value: PaymentTestSession): PaymentTestSession {
  if (value.status === "SUCCEEDED" || value.status === "EXPIRED") return value;
  if (Date.now() > Date.parse(value.finalizeAt))
    return { ...value, status: "EXPIRED", qrUrl: null };
  if (Date.now() >= Date.parse(value.expiresAt))
    return { ...value, status: "WAITING_WEBHOOK", qrUrl: null };
  return value;
}
export function usePaymentTestPolling() {
  const [session, setSession] = useState<PaymentTestSession | null>(null),
    [error, setError] = useState(""),
    [reading, setReading] = useState(false);
  const alive = useRef(true),
    requestRunning = useRef(false);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  function accept(value: PaymentTestSession) {
    if (alive.current) {
      setSession(displaySession(value));
      setError("");
    }
  }
  async function refresh(id: string) {
    if (requestRunning.current) return;
    requestRunning.current = true;
    setReading(true);
    try {
      accept(await paymentSettingsApi.getSession(id));
    } catch {
      if (alive.current)
        setError("Chưa đọc được kết quả. Giữ nguyên phiên và kiểm tra lại.");
    } finally {
      requestRunning.current = false;
      if (alive.current) setReading(false);
    }
  }
  useEffect(() => {
    if (!session || session.status !== "PENDING") return;
    const remaining = Date.parse(session.expiresAt) - Date.now();
    const expiry = setTimeout(
      () =>
        setSession((previous) =>
          previous ? displaySession(previous) : previous,
        ),
      Math.max(0, remaining),
    );
    const poll = setInterval(() => {
      if (Date.now() < Date.parse(session.expiresAt)) void refresh(session.id);
    }, 3000);
    return () => {
      clearInterval(poll);
      clearTimeout(expiry);
    };
    // Refresh uses refs and setters; session identity/status controls the timer lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, session?.status, session?.expiresAt]);
  return { session, accept, error, reading, refresh };
}
