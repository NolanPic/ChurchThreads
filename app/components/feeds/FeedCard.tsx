"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useOrganization } from "@/app/context/OrganizationProvider";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardBody, CardHeader } from "../ui/Card";
import Button from "../ui/Button";
import StackedUsers from "../users/StackedUsers";
import Image from "next/image";
import styles from "./FeedCard.module.css";

type AvatarUser = {
  _id: Id<"users">;
  name: string;
  image: string | null;
};

interface FeedCardProps {
  feed: Doc<"feeds">;
  users: AvatarUser[];
  primaryActionLabel: string;
  onPrimaryAction: () => void;
}

export default function FeedCard({
  feed,
  users,
  primaryActionLabel,
  onPrimaryAction,
}: FeedCardProps) {
  const org = useOrganization();
  const orgId = org?._id as Id<"organizations">;
  const removeMemberFromFeed = useMutation(
    api.userMemberships.removeMemberFromFeed,
  );

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleLeaveFeed = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to leave ${feed.name}?`,
    );

    if (!confirmed) {
      return;
    }

    setIsLeaving(true);
    setLeaveError(null);

    try {
      await removeMemberFromFeed({
        orgId,
        feedId: feed._id,
      });
      setIsMenuOpen(false);
    } catch (error) {
      setLeaveError(
        error instanceof Error ? error.message : "Failed to leave feed",
      );
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className={styles.header}>
        <h2 className={styles.title}>{feed.name}</h2>
        {feed.privacy === "public" && (
          <Image
            src="/icons/globe.svg"
            alt="Public feed"
            width={20}
            height={20}
          />
        )}
        <div className={styles.menu} ref={menuRef} data-menu-open={isMenuOpen}>
          <Button
            icon="ellipsis"
            ariaLabel="Feed options"
            iconSize={24}
            className={styles.menuButton}
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen((value) => !value);
            }}
            noBackground
          />
          <AnimatePresence>
            {isMenuOpen && (
              <motion.ul
                className={styles.menuList}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.1 }}
              >
                <li className={styles.menuItem}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLeaveFeed();
                    }}
                    disabled={isLeaving}
                  >
                    {isLeaving ? "Leaving..." : "Leave feed"}
                  </button>
                </li>
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </CardHeader>

      <CardBody className={styles.cardBody}>
        <div className={styles.bodyRow}>
          <Button variant="primary" onClick={onPrimaryAction}>
            {primaryActionLabel}
          </Button>
          <StackedUsers
            users={users}
            numberOfAvatarsToShow={3}
            showRemainingCount={true}
          />
        </div>
        {leaveError && <p className={styles.error}>{leaveError}</p>}
      </CardBody>
    </Card>
  );
}
