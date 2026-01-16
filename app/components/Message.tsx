import React, { useState, useEffect, useRef } from "react";
import { Id } from "@/convex/_generated/dataModel";
import UserAvatar from "./UserAvatar";
import SanitizedUserContent from "./common/SanitizedUserContent";
import Button from "./common/Button";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUserAuth } from "@/auth/client/useUserAuth";
import { useOrganization } from "../context/OrganizationProvider";
import { useLongPress } from "../hooks/useLongPress";
import classNames from "classnames";
import styles from "./MessageThread.module.css";
import userContentStyles from "./shared-styles/user-content.module.css";

interface MessageProps {
  message: {
    _id: Id<"messages">;
    _creationTime: number;
    sender: {
      _id: Id<"users">;
      name: string;
      image: string | null;
    };
    content: string;
    threadId: Id<"threads">;
  };
  feedId: Id<"feeds">;
  timeAgoLabel: string;
  isCurrentUser: boolean;
  isTabletOrUp: boolean;
}

export default function Message({
  message,
  feedId,
  timeAgoLabel,
  isCurrentUser,
  isTabletOrUp,
}: MessageProps) {
  const [auth] = useUserAuth();
  const org = useOrganization();
  const orgId = org?._id as Id<"organizations">;
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const menuRef = useRef<HTMLElement>(null);

  // Check if user can delete this message
  useEffect(() => {
    if (!auth) {
      setCanDelete(false);
      return;
    }

    const user = auth.getUser();
    if (!user) {
      setCanDelete(false);
      return;
    }

    // User can delete if they're the author or a feed owner
    const isAuthor = message.sender._id === user._id;

    auth
      .feed(feedId)
      .hasRole("owner")
      .then((result) => {
        setCanDelete(isAuthor || result.allowed);
      });
  }, [auth, message.sender._id, feedId]);

  // Handle click outside to close menu
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

  const handleDeleteMessage = async () => {
    if (!confirm("Are you sure you want to delete this message?")) {
      return;
    }

    try {
      await deleteMessage({ orgId, messageId: message._id });
    } catch (error) {
      console.error("Failed to delete message:", error);
      alert("Failed to delete message. Please try again.");
    }
  };

  // Long press for mobile
  const longPressHandlers = useLongPress({
    onLongPress: () => {
      if (!isTabletOrUp && canDelete) {
        setIsMenuOpen(true);
      }
    },
    delay: 800,
  });

  return (
    <li
      className={classNames(styles.message, {
        [styles.messageSelf]: isCurrentUser,
      })}
      {...(!isTabletOrUp && canDelete ? longPressHandlers : {})}
    >
      <article>
        <div className={styles.messageAvatar}>
          <UserAvatar user={message.sender} size={isTabletOrUp ? 34 : 24} />
        </div>
        <div className={styles.messageBubble}>
          <header>
            {message.sender.name}
            {canDelete && isTabletOrUp && (
              <div
                className={styles.messageMenu}
                ref={menuRef as React.RefObject<HTMLDivElement>}
                data-menu-open={isMenuOpen}
              >
                <Button
                  icon="ellipsis"
                  ariaLabel="Message options"
                  iconSize={20}
                  className={styles.messageMenuButton}
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  noBackground
                />
                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.ul
                      className={styles.messageMenuList}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.1 }}
                    >
                      <li className={styles.messageMenuItem}>
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            handleDeleteMessage();
                          }}
                        >
                          Delete message
                        </button>
                      </li>
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            )}
          </header>
          <SanitizedUserContent
            className={classNames(
              styles.messageContent,
              userContentStyles.userContent
            )}
            html={message.content}
          />
        </div>
      </article>
      <span className={styles.messageTimestamp}>{timeAgoLabel}</span>
      {/* Mobile menu (from long press) */}
      {!isTabletOrUp && canDelete && (
        <AnimatePresence>
          {isMenuOpen && (
            <motion.ul
              className={styles.messageMenuListMobile}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.1 }}
              ref={menuRef as React.RefObject<HTMLUListElement>}
            >
              <li className={styles.messageMenuItem}>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleDeleteMessage();
                  }}
                >
                  Delete message
                </button>
              </li>
            </motion.ul>
          )}
        </AnimatePresence>
      )}
    </li>
  );
}
