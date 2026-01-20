"use client";

import { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Icon from "../ui/Icon";
import styles from "./InstallPrompt.module.css";

interface InstallPromptProps {
  isAuthenticated: boolean;
}

type Platform = "ios" | "android" | "desktop";

const DISMISS_KEY = "churchthreads_install_prompt_dismissed_until";
const DISMISS_DURATION_MS = 90 * 24 * 60 * 60 * 1000; // 3 months

export default function InstallPrompt({ isAuthenticated }: InstallPromptProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("desktop");

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Check if user is authenticated
    if (!isAuthenticated) return;

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

    setPlatform(detectedPlatform);

    // Only show on mobile devices
    if (detectedPlatform === "desktop") return;

    // Check if app is already installed (standalone mode)
    const navigatorWithStandalone = window.navigator as Navigator & {
      standalone?: boolean;
    };
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      navigatorWithStandalone.standalone === true;

    if (isStandalone) return;

    // Check if user has dismissed the prompt
    const dismissedUntil = localStorage.getItem(DISMISS_KEY);
    if (dismissedUntil) {
      const dismissedDate = parseInt(dismissedUntil, 10);
      if (!isNaN(dismissedDate) && Date.now() < dismissedDate) {
        return;
      }
    }

    // Show the prompt
    setIsOpen(true);
  }, [isAuthenticated]);

  const handleSoftClose = () => {
    setIsOpen(false);
  };

  const handleDecisionClose = () => {
    const dismissUntil = Date.now() + DISMISS_DURATION_MS;
    localStorage.setItem(DISMISS_KEY, dismissUntil.toString());
    setIsOpen(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleSoftClose}
      title="Install churchthreads"
      dragToClose={true}
      ariaLabel="Install churchthreads app instructions"
    >
      <div className={styles.content}>
        {platform === "ios" && (
          <ol className={styles.steps}>
            <li>
              Tap the <Icon name="share" size={20} /> Share button in Safari
            </li>
            <li>Scroll down and tap &ldquo;Add to Home Screen&rdquo;</li>
            <li>Tap &ldquo;Add&rdquo; in the top right</li>
            <li>Once installed, open the app</li>
            <li className={styles.benefit}>
              From here, you&apos;ll be able to set up notifications!
            </li>
          </ol>
        )}
        {platform === "android" && (
          <ol className={styles.steps}>
            <li>Tap the menu button (three dots)</li>
            <li>
              Tap &ldquo;Add to Home screen&rdquo; or &ldquo;Install app&rdquo;
            </li>
            <li>Once installed, open the app</li>
            <li className={styles.benefit}>
              From here, you&apos;ll be able to set up notifications!
            </li>
          </ol>
        )}
        <div className={styles.toolbar}>
          <Button
            variant="primary"
            onClick={handleDecisionClose}
            className={styles.toolbarButton}
          >
            Done!
          </Button>
          <Button
            onClick={handleDecisionClose}
            className={styles.toolbarButton}
          >
            No thanks
          </Button>
        </div>
      </div>
    </Modal>
  );
}
