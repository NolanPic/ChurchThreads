"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import styles from "./PushNotificationPrompt.module.css";

interface PushNotificationPromptProps {
  isAuthenticated: boolean;
  orgId: Id<"organizations"> | undefined;
}

type Platform = "ios" | "android" | "desktop";

const DISMISS_KEY = "churchthreads_push_prompt_dismissed_until";
const DISMISS_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 1 month

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationPrompt({
  isAuthenticated,
  orgId,
}: PushNotificationPromptProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const createPushSubscription = useMutation(
    api.pushSubscriptions.createPushSubscription,
  );

  useEffect(() => {
    async function checkAndShowPrompt() {
      // Only run on client side
      if (typeof window === "undefined") return;

      // Check if user is authenticated
      if (!isAuthenticated || !orgId) return;

      // Detect platform
      const userAgent = navigator.userAgent.toLowerCase();
      const detectedPlatform: Platform =
        userAgent.includes("iphone") ||
        userAgent.includes("ipad") ||
        userAgent.includes("ipod")
          ? "ios"
          : userAgent.includes("android")
            ? "android"
            : "desktop";

      // Only show on mobile devices
      if (detectedPlatform === "desktop") return;

      // Check if in standalone mode for iOS, or either mode for Android
      const navigatorWithStandalone = window.navigator as Navigator & {
        standalone?: boolean;
      };
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        navigatorWithStandalone.standalone === true;

      if (detectedPlatform === "ios" && !isStandalone) return;

      // Check if service worker and push notifications are supported
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return;
      }

      // Check if user has dismissed the prompt
      const dismissedUntil = localStorage.getItem(DISMISS_KEY);
      if (dismissedUntil) {
        const dismissedDate = parseInt(dismissedUntil, 10);
        if (!isNaN(dismissedDate) && Date.now() < dismissedDate) {
          return;
        }
      }

      // Check if there's an existing push subscription in the browser
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          // Already subscribed, don't show prompt
          return;
        }

        // No subscription exists, show the prompt
        setIsOpen(true);
      } catch (error) {
        console.error("Error checking push subscription:", error);
      }
    }

    checkAndShowPrompt();
  }, [isAuthenticated, orgId]);

  const handleConfirm = async () => {
    if (!orgId) return;

    setIsSubscribing(true);

    try {
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Request notification permission
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setIsOpen(false);
        setIsSubscribing(false);
        return;
      }

      // Subscribe to push notifications
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error("VAPID public key not found");
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          vapidPublicKey,
        ) as BufferSource,
      });

      // Save subscription to database
      try {
        await createPushSubscription({
          orgId,
          subscription: subscription.toJSON() as {
            endpoint: string;
            keys: { p256dh: string; auth: string };
            expirationTime: number | null;
          },
        });

        setIsOpen(false);
      } catch (error) {
        console.error("Failed to save subscription to database:", error);
        // Unsubscribe from browser push subscription if database save fails
        await subscription.unsubscribe();
        throw error;
      }
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      setIsOpen(false);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleNoThanks = () => {
    const dismissUntil = Date.now() + DISMISS_DURATION_MS;
    localStorage.setItem(DISMISS_KEY, dismissUntil.toString());
    setIsOpen(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleNoThanks}
      title="Enable notifications"
      dragToClose={true}
      ariaLabel="Enable push notifications"
    >
      <div className={styles.content}>
        <p className={styles.description}>
          Stay up to date with new posts, messages, and activity in your feeds.
        </p>
        <div className={styles.toolbar}>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={isSubscribing}
            className={styles.toolbarButton}
          >
            {isSubscribing ? "Setting up..." : "Confirm"}
          </Button>
          <Button
            onClick={handleNoThanks}
            disabled={isSubscribing}
            className={styles.toolbarButton}
          >
            Later
          </Button>
        </div>
      </div>
    </Modal>
  );
}
