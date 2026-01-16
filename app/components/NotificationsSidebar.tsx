"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useOrganization } from "../context/OrganizationProvider";
import Backdrop from "./common/Backdrop";
import Icon from "./common/Icon";
import styles from "./NotificationsSidebar.module.css";
import { useRouter } from "next/navigation";
import { EnrichedNotification } from "@/convex/notifications";

interface NotificationsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "all" | "unread";

export default function NotificationsSidebar({
  isOpen,
  onClose,
}: NotificationsSidebarProps) {
  const org = useOrganization();
  const orgId = org?._id as Id<"organizations">;
  const router = useRouter();
  const endOfList = useRef<HTMLDivElement>(null);
  const intersectionCb = useRef<IntersectionObserverCallback | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("unread");

  const itemsPerPage = 25;

  const { results, status, loadMore } = usePaginatedQuery(
    api.notifications.getUserNotifications,
    isOpen && orgId ? { orgId } : "skip",
    { initialNumItems: itemsPerPage }
  );

  const markAsRead = useMutation(api.notifications.markNotificationAsRead);
  const clearAll = useMutation(api.notifications.clearNotifications);

  // Filter notifications based on active tab
  const filteredResults = useMemo(() => {
    if (!results) return [];
    if (activeTab === "all") return results;
    return results.filter((notification) => !notification.readAt);
  }, [results, activeTab]);

  // IntersectionObserver for pagination
  const handleIntersection = (entries: IntersectionObserverEntry[]) => {
    if (entries[0] && entries[0].isIntersecting && status === "CanLoadMore") {
      loadMore(itemsPerPage);
    }
  };

  useEffect(() => {
    intersectionCb.current = handleIntersection;
  });

  useEffect(() => {
    if (
      status === "LoadingFirstPage" ||
      status === "Exhausted" ||
      !results ||
      results.length === 0
    ) {
      return;
    }

    const observer = new IntersectionObserver((entries, observer) => {
      intersectionCb.current?.(entries, observer);
    });

    if (endOfList.current) {
      observer.observe(endOfList.current);
    }

    return () => observer.disconnect();
  }, [status, results]);

  const handleClearAll = async () => {
    if (!orgId) return;
    await clearAll({ orgId });
  };

  const handleNotificationClick = async (
    notification: EnrichedNotification
  ) => {
    if (!orgId) return;

    // Mark as read
    await markAsRead({ orgId, notificationId: notification._id });

    // Navigate to the notification's action URL
    router.push(notification.action.url);

    // Close sidebar
    onClose();
  };

  const handleDotClick = async (
    e: React.MouseEvent,
    notificationId: Id<"notifications">
  ) => {
    e.stopPropagation();
    if (!orgId) return;
    await markAsRead({ orgId, notificationId });
  };

  if (!isOpen) return null;

  return (
    <>
      <Backdrop onClick={onClose} />
      <motion.aside
        className={styles.sidebar}
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Notifications</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close notifications"
          >
            <Icon name="close" size={24} />
          </button>
        </div>

        <div className={styles.tabsAndClearContainer}>
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === "unread" ? styles.active : ""}`}
              onClick={() => setActiveTab("unread")}
            >
              Unread
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === "all" ? styles.active : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All
            </button>
          </div>

          {results && results.length > 0 && (
            <button
              type="button"
              className={styles.clearAllButton}
              onClick={handleClearAll}
            >
              Clear all
            </button>
          )}
        </div>

        <div className={styles.notificationsList}>
          {status === "LoadingFirstPage" && (
            <div className={styles.loading}>Loading notifications...</div>
          )}

          {filteredResults.length === 0 && status !== "LoadingFirstPage" && (
            <div className={styles.empty}>
              {activeTab === "unread"
                ? "No unread notifications"
                : "No notifications"}
            </div>
          )}

          {filteredResults.map((notification) => (
            <button
              key={notification._id}
              type="button"
              className={`${styles.notificationItem} ${notification.readAt ? styles.read : styles.unread}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className={styles.notificationContent}>
                <div className={styles.notificationTitle}>
                  {notification.title}
                </div>
                <div className={styles.notificationBody}>
                  {notification.body}
                </div>
              </div>
              {!notification.readAt && (
                <button
                  type="button"
                  className={styles.unreadDot}
                  onClick={(e) => handleDotClick(e, notification._id)}
                  aria-label="Mark as read"
                />
              )}
            </button>
          ))}

          <div ref={endOfList} />

          {status === "LoadingMore" && (
            <div className={styles.loadingMore}>Loading more...</div>
          )}
        </div>
      </motion.aside>
    </>
  );
}
