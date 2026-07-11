"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useMounted } from "@/hooks/useMounted";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Camera, Save, Sun, Moon } from "lucide-react";
import { TwoFactorSettings } from "@/components/auth/TwoFactorSettings";

export function SettingsPanel() {
  const { data: session, update } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: session?.user?.name ?? "",
    username: session?.user?.username ?? "",
    bio: session?.user?.bio ?? "",
    statusMessage: session?.user?.statusMessage ?? "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleProfileUpdate = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          username: form.username,
          bio: form.bio,
          statusMessage: form.statusMessage,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      await update();
      setMessage("Profile updated successfully");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "changePassword",
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
          confirmPassword: form.confirmPassword,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setMessage("Password updated successfully");
      setForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Password change failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profilePicture: data.data.profilePicture }),
      });

      await update();
      setMessage("Profile picture updated");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-lg font-semibold">Settings</h2>

      {message && (
        <div className="rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary">{message}</div>
      )}

      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar
            src={session?.user?.profilePicture}
            name={session?.user?.name ?? "User"}
            size="lg"
          />
          <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
            <Camera className="h-4 w-4" />
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </label>
        </div>
        <div>
          <p className="font-medium">{session?.user?.name}</p>
          <p className="text-sm text-muted-foreground">@{session?.user?.username}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Profile</h3>
        <Input
          label="Name"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
        />
        <Input
          label="Username"
          value={form.username}
          onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
        />
        <Textarea
          label="Bio"
          value={form.bio}
          onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
        />
        <Input
          label="Status Message"
          value={form.statusMessage}
          onChange={(e) => setForm((p) => ({ ...p, statusMessage: e.target.value }))}
        />
        <Button onClick={handleProfileUpdate} loading={loading}>
          <Save className="h-4 w-4" /> Save Profile
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Theme</h3>
        <div className="flex gap-2">
          <Button
            variant={mounted && resolvedTheme === "light" ? "primary" : "outline"}
            onClick={() => setTheme("light")}
          >
            <Sun className="h-4 w-4" /> Light
          </Button>
          <Button
            variant={mounted && resolvedTheme === "dark" ? "primary" : "outline"}
            onClick={() => setTheme("dark")}
          >
            <Moon className="h-4 w-4" /> Dark
          </Button>
        </div>
      </div>

      <TwoFactorSettings onMessage={setMessage} />

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Change Password</h3>
        <Input
          label="Current Password"
          type="password"
          value={form.currentPassword}
          onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))}
        />
        <Input
          label="New Password"
          type="password"
          value={form.newPassword}
          onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
        />
        <Input
          label="Confirm New Password"
          type="password"
          value={form.confirmPassword}
          onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
        />
        <Button variant="outline" onClick={handlePasswordChange} loading={loading}>
          Update Password
        </Button>
      </div>
    </div>
  );
}
