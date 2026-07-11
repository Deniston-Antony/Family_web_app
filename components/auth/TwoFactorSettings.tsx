"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Shield, ShieldCheck, ShieldOff } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface TwoFactorSettingsProps {
  onMessage: (message: string) => void;
}

export function TwoFactorSettings({ onMessage }: TwoFactorSettingsProps) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCodeDataUrl: string;
    manualEntryKey: string;
  } | null>(null);
  const [enableCode, setEnableCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");

  const fetchStatus = async () => {
    const res = await fetch("/api/auth/2fa");
    const data = await res.json();
    if (data.success) {
      setEnabled(data.data.enabled);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleStartSetup = async () => {
    setActionLoading(true);
    onMessage("");
    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSetupData(data.data);
      setEnableCode("");
    } catch (err) {
      onMessage(err instanceof Error ? err.message : "Failed to start setup");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnable = async () => {
    if (!setupData) return;
    setActionLoading(true);
    onMessage("");
    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "enable",
          secret: setupData.secret,
          code: enableCode,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setEnabled(true);
      setSetupData(null);
      setEnableCode("");
      onMessage("Two-factor authentication enabled");
    } catch (err) {
      onMessage(err instanceof Error ? err.message : "Failed to enable 2FA");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisable = async () => {
    setActionLoading(true);
    onMessage("");
    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "disable",
          password: disablePassword,
          code: disableCode,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setEnabled(false);
      setDisablePassword("");
      setDisableCode("");
      onMessage("Two-factor authentication disabled");
    } catch (err) {
      onMessage(err instanceof Error ? err.message : "Failed to disable 2FA");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading security settings...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {enabled ? (
          <ShieldCheck className="h-4 w-4 text-green-500" />
        ) : (
          <Shield className="h-4 w-4 text-muted-foreground" />
        )}
        <h3 className="text-sm font-semibold text-muted-foreground">Two-Factor Authentication</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Add an extra layer of security using an authenticator app like Google Authenticator or
        Authy.
      </p>

      {enabled ? (
        <div className="space-y-3 rounded-xl border border-border p-4">
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            2FA is enabled on your account
          </p>
          <Input
            label="Password"
            type="password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
          />
          <Input
            label="Authenticator code"
            inputMode="numeric"
            placeholder="123456"
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          <Button
            variant="outline"
            onClick={handleDisable}
            loading={actionLoading}
            disabled={!disablePassword || disableCode.length !== 6}
          >
            <ShieldOff className="h-4 w-4" />
            Disable 2FA
          </Button>
        </div>
      ) : setupData ? (
        <div className="space-y-4 rounded-xl border border-border p-4">
          <p className="text-sm font-medium">Scan this QR code with your authenticator app</p>
          <div className="mx-auto w-fit rounded-xl bg-white p-3">
            <Image
              src={setupData.qrCodeDataUrl}
              alt="2FA QR code"
              width={180}
              height={180}
              unoptimized
            />
          </div>
          <div className="rounded-xl bg-muted/50 px-3 py-2">
            <p className="text-xs text-muted-foreground">Manual entry key</p>
            <p className="break-all font-mono text-sm">{setupData.manualEntryKey}</p>
          </div>
          <Input
            label="Enter 6-digit code"
            inputMode="numeric"
            placeholder="123456"
            value={enableCode}
            onChange={(e) => setEnableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setSetupData(null)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleEnable}
              loading={actionLoading}
              disabled={enableCode.length !== 6}
            >
              Enable 2FA
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={handleStartSetup} loading={actionLoading}>
          <Shield className="h-4 w-4" />
          Set Up 2FA
        </Button>
      )}
    </div>
  );
}
