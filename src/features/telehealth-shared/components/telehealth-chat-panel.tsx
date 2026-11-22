'use client';

import { FormEvent, useRef, useState } from 'react';
import { FileText, Paperclip, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TelehealthMessageDto, telehealthApi } from '@/lib/api/telehealth.api';

export interface TelehealthChatPanelProps {
  encounterId: string;
  currentRole: 'FAMILY_REP' | 'DOCTOR';
  messages: TelehealthMessageDto[];
  isFallbackChat?: boolean;
  onSendMessage: (content: string) => Promise<void>;
  onUploadAttachment: (file: File, caption?: string) => Promise<void>;
}

export function TelehealthChatPanel({
  encounterId,
  currentRole,
  messages,
  isFallbackChat = false,
  onSendMessage,
  onUploadAttachment,
}: TelehealthChatPanelProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError(null);
    try {
      await onSendMessage(trimmed);
      setText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi tin nhắn.');
    } finally {
      setSending(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setSending(true);
    setError(null);
    try {
      await onUploadAttachment(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải tệp đính kèm.');
    } finally {
      setSending(false);
    }
  };

  const handleOpenAttachment = async (msg: TelehealthMessageDto) => {
    try {
      const blob = await telehealthApi.fetchAttachmentBlob(encounterId, msg.id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setError('Không thể tải tệp đính kèm.');
    }
  };

  return (
    <div className="flex h-full flex-col rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <span className="text-sm font-semibold">Chat y tế</span>
        {isFallbackChat && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
            Polling dự phòng
          </span>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            Chưa có tin nhắn nào trong phiên khám này.
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderRole === currentRole;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
              >
                <span className="mb-1 text-[11px] text-muted-foreground">{msg.senderName}</span>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                    isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                  }`}
                >
                  {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                  {msg.attachmentName && (
                    <button
                      type="button"
                      onClick={() => void handleOpenAttachment(msg)}
                      className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-current/20 px-2.5 py-1 text-xs underline-offset-2 hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>{msg.attachmentName}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && <p className="px-4 py-1 text-xs text-destructive">{error}</p>}

      <form onSubmit={(e) => void handleSubmit(e)} className="flex items-center gap-2 border-t p-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          className="hidden"
          onChange={(e) => void handleFileChange(e)}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={sending}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Đính kèm ảnh hoặc tài liệu"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nhập tin nhắn y tế..."
          disabled={sending}
        />
        <Button type="submit" size="icon" disabled={sending || !text.trim()} aria-label="Gửi">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
