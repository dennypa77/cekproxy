"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertIcon, CopyIcon, RefreshIcon } from "@/components/icons";
import { Modal } from "@/components/Modal";
import { Button, inputClass, labelClass } from "@/components/ui";
import { apiFetch, orderApi } from "@/lib/client/api";
import { copyText } from "@/lib/client/clipboard";
import type { ProxyCredentials } from "@/lib/public-types";

const PATTERN = /^[a-zA-Z0-9]{8,32}$/;
const CHARS = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCredential(length = 14): string {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (n) => CHARS[n % CHARS.length]).join("");
}

export function CredentialsModal({
  orderNo,
  open,
  current,
  onClose,
  onChanged,
}: {
  orderNo: string;
  open: boolean;
  current: ProxyCredentials | null;
  onClose: () => void;
  onChanged: (credentials: ProxyCredentials) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setUsername(current?.username ?? "");
    setPassword(current?.password ?? "");
    setError(null);
  }, [open, current]);

  const changedUsername = username.trim() !== (current?.username ?? "");
  const changedPassword = password.trim() !== (current?.password ?? "");
  const nothingChanged = !changedUsername && !changedPassword;

  async function submit() {
    if (submitting) return;
    const patch: { username?: string; password?: string } = {};
    if (changedUsername) patch.username = username.trim();
    if (changedPassword) patch.password = password.trim();

    if (!patch.username && !patch.password) {
      setError("Belum ada perubahan. Ubah username atau password terlebih dahulu.");
      return;
    }
    for (const value of Object.values(patch)) {
      if (!PATTERN.test(value)) {
        setError("Gunakan 8-32 karakter huruf dan angka saja, tanpa spasi atau simbol.");
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    const result = await apiFetch<ProxyCredentials>(orderApi(orderNo, "credentials"), {
      method: "POST",
      body: JSON.stringify(patch),
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success("Username & password proxy berhasil diganti");
    onChanged(result.data);
  }

  async function copyBoth() {
    const ok = await copyText(username + ":" + password);
    if (ok) toast.success("Username & password disalin");
    else toast.error("Gagal menyalin.");
  }

  return (
    <Modal open={open} title="Ganti" accent="User & Password" onClose={onClose} dismissible={!submitting}>
      <div className="space-y-4">
        <div className="flex gap-3 rounded-2xl border-2 border-ink bg-warn-soft p-3.5 text-sm">
          <AlertIcon className="mt-0.5 size-4 shrink-0" />
          <p>
            Setelah diganti, <b>semua aplikasi yang memakai proxy ini harus diperbarui</b> dengan username dan password
            baru. Koneksi dengan kredensial lama akan langsung ditolak.
          </p>
        </div>

        <div>
          <label htmlFor="cred-username" className={labelClass}>
            Username baru
          </label>
          <div className="flex gap-2">
            <input
              id="cred-username"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setError(null);
              }}
              autoComplete="off"
              spellCheck={false}
              maxLength={32}
              disabled={submitting}
              className={inputClass + " font-mono"}
            />
            <Button
              variant="secondary"
              onClick={() => setUsername(randomCredential())}
              disabled={submitting}
              aria-label="Acak username"
            >
              <RefreshIcon className="size-4" />
            </Button>
          </div>
        </div>

        <div>
          <label htmlFor="cred-password" className={labelClass}>
            Password baru
          </label>
          <div className="flex gap-2">
            <input
              id="cred-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError(null);
              }}
              autoComplete="off"
              spellCheck={false}
              maxLength={32}
              disabled={submitting}
              className={inputClass + " font-mono"}
            />
            <Button
              variant="secondary"
              onClick={() => setPassword(randomCredential())}
              disabled={submitting}
              aria-label="Acak password"
            >
              <RefreshIcon className="size-4" />
            </Button>
          </div>
          <p className="mt-1.5 text-xs text-muted">8-32 karakter, huruf dan angka saja.</p>
        </div>

        <Button variant="secondary" size="sm" onClick={copyBoth} disabled={submitting} className="w-full">
          <CopyIcon className="size-4" /> Salin user:pass
        </Button>

        {error && !submitting && (
          <p className="flex gap-2 rounded-2xl border-2 border-ink bg-bad-soft p-3.5 text-sm font-semibold" role="alert">
            <AlertIcon className="mt-0.5 size-4 shrink-0" /> {error}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button variant="secondary" size="lg" onClick={onClose} disabled={submitting}>
            Batal
          </Button>
          <Button variant="brand" size="lg" onClick={submit} loading={submitting} disabled={nothingChanged}>
            {submitting ? "Menyimpan" : "Simpan"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
