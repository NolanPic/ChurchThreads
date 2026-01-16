"use client";

import { ReactNode, useEffect, useCallback, useId, useRef } from "react";
import {
  motion,
  useAnimate,
  useDragControls,
  useMotionValue,
  AnimatePresence,
} from "framer-motion";
import styles from "./Modal.module.css";
import Icon from "./Icon";
import { useMediaQuery } from "@/app/hooks/useMediaQuery";
import { useLockBodyScroll } from "@/app/hooks/useLockBodyScroll";

interface ModalToolbarProps {
  onClose: () => void;
}

export interface ModalTab {
  id: string;
  label: string;
  content: ReactNode;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  ariaLabel?: string;
  dragToClose?: boolean;
  toolbar?: (props: ModalToolbarProps) => React.ReactNode;
  tabs?: ModalTab[];
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  ariaLabel,
  dragToClose = false,
  toolbar,
  tabs,
  activeTabId,
  onTabChange,
}: ModalProps) {
  const [scope, animate] = useAnimate();
  const y = useMotionValue(0);
  const dragControls = useDragControls();
  const isTabletOrUp = useMediaQuery("(min-width: 34.375rem)");
  const doAnimateDragToCloseOnPhone = !isTabletOrUp && dragToClose;
  const tabListRef = useRef<HTMLDivElement>(null);

  useLockBodyScroll(isOpen);

  const handleClose = useCallback(async () => {
    if (doAnimateDragToCloseOnPhone) {
      const currentY = typeof y.get() === "number" ? y.get() : 0;
      const offscreen =
        typeof window !== "undefined" ? window.innerHeight : 500;
      await animate("#modal", { y: [currentY, offscreen] });
    }
    onClose();
  }, [doAnimateDragToCloseOnPhone, y, animate, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, handleClose]);

  // Ensure drag position is reset when opening/closing
  useEffect(() => {
    if (isTabletOrUp) return;
    if (isOpen) {
      y.set(0);
      animate("#modal", { y: 0 }, { duration: 0 });
    } else {
      y.set(0);
    }
  }, [isOpen, animate, isTabletOrUp, y]);

  const titleId = useId();
  const tabPanelId = useId();

  // Handle keyboard navigation for tabs
  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (!tabs || !onTabChange) return;

      let targetIndex = index;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          targetIndex = index > 0 ? index - 1 : tabs.length - 1;
          break;
        case "ArrowRight":
          e.preventDefault();
          targetIndex = index < tabs.length - 1 ? index + 1 : 0;
          break;
        case "Home":
          e.preventDefault();
          targetIndex = 0;
          break;
        case "End":
          e.preventDefault();
          targetIndex = tabs.length - 1;
          break;
        default:
          return;
      }

      const targetTab = tabs[targetIndex];
      if (targetTab) {
        onTabChange(targetTab.id);
        // Focus the new tab
        setTimeout(() => {
          const tabButton = tabListRef.current?.querySelector(
            `[data-tab-id="${targetTab.id}"]`
          ) as HTMLButtonElement;
          tabButton?.focus();
        }, 0);
      }
    },
    [tabs, onTabChange]
  );

  const activeTab = tabs?.find((tab) => tab.id === activeTabId);
  const content = tabs ? activeTab?.content : children;

  const modal = isOpen ? (
    <motion.div
      ref={scope}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      aria-labelledby={title && !ariaLabel ? titleId : undefined}
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ duration: 0.2 }}
      className={styles.modalWrapper}
    >
      <motion.div
        id="modal"
        className={styles.modal}
        style={{ y }}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.8 }}
        onDragEnd={() => {
          if (y.get() >= 175) {
            handleClose();
          } else {
            animate("#modal", { y: [y.get(), 0] });
          }
        }}
      >
        {dragToClose && (
          <button
            aria-label="Drag to close"
            className={styles.handleBar_PhoneOnly}
            type="button"
            onPointerDown={(e) => {
              dragControls.start(e);
            }}
          ></button>
        )}
        <button
          aria-label="Close"
          className={styles.closeButton_TabletUp}
          type="button"
          onClick={handleClose}
        >
          <Icon name="close" size={24} />
        </button>
        {title && (
          <div className={styles.heading}>
            <h1 className={styles.title} id={titleId}>
              {title}
            </h1>
            {subtitle && <h2 className={styles.subtitle}>{subtitle}</h2>}
          </div>
        )}
        {tabs && tabs.length > 1 && (
          <div className={styles.tabsContainer}>
            <div className={styles.tabsFade} />
            <div
              ref={tabListRef}
              role="tablist"
              aria-label={title || "Modal tabs"}
              className={styles.tabList}
            >
              {tabs.map((tab, index) => {
                const isActive = tab.id === activeTabId;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={tabPanelId}
                    tabIndex={isActive ? 0 : -1}
                    data-tab-id={tab.id}
                    className={`${styles.tab} ${isActive ? styles.active : ""}`}
                    onClick={() => onTabChange?.(tab.id)}
                    onKeyDown={(e) => handleTabKeyDown(e, index)}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {(title || tabs) && <hr className={styles.separator} />}
        <div
          role={tabs ? "tabpanel" : undefined}
          id={tabs ? tabPanelId : undefined}
          aria-labelledby={
            tabs && activeTabId ? `tab-${activeTabId}` : undefined
          }
          tabIndex={tabs ? 0 : undefined}
        >
          {content}
        </div>
      </motion.div>
      {toolbar && (
        <div className={styles.toolbar}>
          {toolbar({ onClose: handleClose })}
        </div>
      )}
    </motion.div>
  ) : null;

  return doAnimateDragToCloseOnPhone ? (
    modal
  ) : (
    <AnimatePresence>{modal}</AnimatePresence>
  );
}
