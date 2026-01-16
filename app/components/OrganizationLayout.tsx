"use client";

import UserAvatarMenu from "./UserAvatarMenu";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useOrganization } from "../context/OrganizationProvider";
import { usePathname, useRouter } from "next/navigation";
import { useUserAuth } from "@/auth/client/useUserAuth";
import styles from "./OrganizationLayout.module.css";
import { useState, useEffect, useRef } from "react";
import ProfileModal from "./ProfileModal";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import NotificationsSidebar from "./NotificationsSidebar";
import Icon from "./common/Icon";
import InstallPrompt from "./InstallPrompt";
import PushNotificationPrompt from "./PushNotificationPrompt";
import NotificationMarkAsRead from "./NotificationMarkAsRead";

export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const org = useOrganization();
  const pathname = usePathname();
  const router = useRouter();
  const [auth] = useUserAuth();
  const isSignedIn = auth !== null;
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    const segments = (pathname ?? "").split("/").filter(Boolean);
    const isProfilePath =
      segments[0] === "profile" || segments.includes("profile");
    setIsProfileModalOpen(isProfilePath);
  }, [pathname]);
  const [isNotificationsSidebarOpen, setIsNotificationsSidebarOpen] =
    useState(false);

  const feedWrapperRef = useRef<HTMLElement>(null);

  const scrollToFeed = () => {
    feedWrapperRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const orgId = org?._id as Id<"organizations">;
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    isSignedIn && orgId ? { orgId } : "skip"
  );

  // Register service worker for push notifications
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Service Worker registration failed:", error);
      });

      // Create test notification function on window object
      if (!window.__churchthreads) {
        window.__churchthreads = {};
      }

      window.__churchthreads.showNotification = async (
        title: string,
        body: string
      ) => {
        try {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(title, {
            body,
            icon: "/logo.png",
            badge: "/logo.png",
          });
          console.log("Test notification sent:", { title, body });
        } catch (error) {
          console.error("Failed to show notification:", error);
        }
      };
    }
  }, []);

  if (org === null) {
    return (
      <div className={styles.notFound}>
        <p>Hmm, that doesn&apos;t exist. 🤔🤷‍♀️</p>
      </div>
    );
  }

  return (
    <>
      <NotificationMarkAsRead />
      {pathname !== "/login" && (
        <>
          {isSignedIn ? (
            <>
              <button
                type="button"
                className={styles.notificationBellButton}
                onClick={() => setIsNotificationsSidebarOpen(true)}
                aria-label="Open notifications"
              >
                <Icon name="bell" size={24} />
                {unreadCount !== undefined && unreadCount > 0 && (
                  <span className={styles.badge}>{unreadCount}</span>
                )}
              </button>
              <div className={styles.userAvatarMenu}>
                <UserAvatarMenu
                  openProfileModal={() => setIsProfileModalOpen(true)}
                />
              </div>
            </>
          ) : (
            <div className={styles.loginLink}>
              <Link href="/login">Sign in</Link>
            </div>
          )}
        </>
      )}
      <section className={styles.header}>
        <h1 className={styles.mainTitle}>{org?.name}</h1>
        <h2 className={styles.location}>{org?.location}</h2>
        <button
          type="button"
          onClick={scrollToFeed}
          className={styles.scrollToFeedButton}
          aria-label="Scroll to feed"
        >
          <Image
            src="/icons/chevron-down.svg"
            alt=""
            width={22}
            height={22}
            className={styles.lightPointer}
          />
        </button>
      </section>
      {org?._id && (
        <motion.section
          ref={feedWrapperRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className={styles.feedWrapper}
        >
          {children}
        </motion.section>
      )}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
        }}
      />
      <AnimatePresence>
        {isNotificationsSidebarOpen && (
          <NotificationsSidebar
            isOpen={isNotificationsSidebarOpen}
            onClose={() => setIsNotificationsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      <InstallPrompt isAuthenticated={isSignedIn} />
      <PushNotificationPrompt isAuthenticated={isSignedIn} orgId={orgId} />
    </>
  );
}
