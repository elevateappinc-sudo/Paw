"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export type NotificationPermission = "default" | "granted" | "denied";

export interface UsePushNotificationsReturn {
  isSupported: boolean;
  isIOS: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  requestPermission: () => Promise<boolean>;
  unsubscribe: () => Promise<void>;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported] = useState<boolean>(
    typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window
  );

  const [isIOS] = useState<boolean>(
    typeof window !== "undefined" &&
      /iPad|iPhone|iPod/.test(navigator.userAgent)
  );

  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!isSupported) return;
    setPermission(Notification.permission as NotificationPermission);

    navigator.serviceWorker.ready.then(async (registration) => {
      const sub = await registration.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    });
  }, [isSupported]);

  async function requestPermission(): Promise<boolean> {
    if (!isSupported) return false;

    const result = await Notification.requestPermission();
    setPermission(result as NotificationPermission);

    if (result !== "granted") return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidKey) {
        console.warn("[PushNotifications] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set");
        return false;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
      });

      const sub = subscription.toJSON();
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return false;

      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: sub.endpoint!,
          p256dh: (sub.keys as Record<string, string>)?.p256dh ?? "",
          auth: (sub.keys as Record<string, string>)?.auth ?? "",
          platform: isIOS ? "ios" : "web",
          active: true,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: "user_id,endpoint" }
      );

      if (error) {
        console.error("[PushNotifications] Error saving subscription:", error);
        return false;
      }

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error("[PushNotifications] Subscribe error:", err);
      return false;
    }
  }

  async function unsubscribe(): Promise<void> {
    if (!isSupported) return;

    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();

    if (!sub) return;

    const endpoint = sub.endpoint;
    await sub.unsubscribe();

    const supabase = createClient();
    await supabase
      .from("push_subscriptions")
      .update({ active: false })
      .eq("endpoint", endpoint);

    setIsSubscribed(false);
    setPermission("default");
  }

  return { isSupported, isIOS, permission, isSubscribed, requestPermission, unsubscribe };
}
