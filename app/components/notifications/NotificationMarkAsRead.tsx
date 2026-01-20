"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useOrganization } from "@/app/context/OrganizationProvider";
import { Id } from "@/convex/_generated/dataModel";

export default function NotificationMarkAsRead() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const org = useOrganization();
  const markAsRead = useMutation(api.notifications.markNotificationAsRead);

  // Track if we've already processed to avoid double-calls
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    // Only run once
    if (hasProcessedRef.current) return;

    const notificationId = searchParams.get("notificationId");

    if (!notificationId || !org?._id) {
      return;
    }

    hasProcessedRef.current = true;

    // Mark as read immediately (don't wait for response)
    markAsRead({
      orgId: org._id,
      notificationId: notificationId as Id<"notifications">,
    }).catch((error) => {
      console.error("Failed to mark notification as read:", error);
      // Don't throw - this is a non-critical operation
    });

    // Clean up URL (remove notificationId parameter)
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("notificationId");

    // Construct new URL
    const newSearch = newParams.toString();
    const newUrl =
      pathname + (newSearch ? `?${newSearch}` : "") + window.location.hash;

    // Replace URL without triggering navigation
    router.replace(newUrl, { scroll: false });
  }, [searchParams, org, markAsRead, router, pathname]);

  // This component renders nothing
  return null;
}
