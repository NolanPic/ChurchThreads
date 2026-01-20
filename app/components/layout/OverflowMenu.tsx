"use client";

import Icon from "../ui/Icon";
import Link from "next/link";
import styles from "./OverflowMenu.module.css";
import UserAvatar from "../users/UserAvatar";
import { useUserAuth } from "@/auth/client/useUserAuth";
import { CurrentFeedAndThreadContext } from "@/app/context/CurrentFeedAndThreadProvider";
import { useContext } from "react";

type PopoverElement = HTMLElement & {
  hidePopover: () => void;
};

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

const OverflowMenuItem = ({ label, icon, href }: MenuItem) => {
  const handleClick = () => {
    // Close the popover when a menu item is clicked
    const popover = document.getElementById(
      "overflow-menu"
    ) as PopoverElement | null;
    if (popover && "hidePopover" in popover) {
      popover.hidePopover();
    }
  };

  return (
    <li role="none" className={styles.overflowMenuItem}>
      <Link role="menuitem" href={href} onClick={handleClick}>
        {icon}
        <p>{label}</p>
      </Link>
    </li>
  );
};

interface OverflowMenuProps {
  showAdminSettings: boolean;
  showFeedSettings: boolean;
  showFeedMembers: boolean;
}

const ICON_SIZE = 24;

export default function OverflowMenu({
  showAdminSettings,
  showFeedSettings,
  showFeedMembers,
}: OverflowMenuProps) {
  const [, { user }] = useUserAuth();
  const { feedId } = useContext(CurrentFeedAndThreadContext);
  return (
    <ul
      popover="auto"
      role="menu"
      id="overflow-menu"
      className={styles.overflowMenu}
    >
      {showFeedSettings && !!feedId && (
        <OverflowMenuItem
          label="Feed settings"
          icon={<Icon name="toggles" size={ICON_SIZE} />}
          href={`/feed/${feedId}/settings`}
        />
      )}
      {showFeedMembers && !!feedId && (
        <OverflowMenuItem
          label="Members"
          icon={<Icon name="users" size={ICON_SIZE} />}
          href={`/feed/${feedId}/settings`}
        />
      )}
      {showAdminSettings && (
        <OverflowMenuItem
          label="Admin"
          icon={<Icon name="gear" size={ICON_SIZE} />}
          href="/admin"
        />
      )}
      {user && (
        <OverflowMenuItem
          label="Profile"
          icon={<UserAvatar user={user} size={ICON_SIZE} />}
          href="/profile"
        />
      )}
      <OverflowMenuItem
        label="Sign out"
        icon={<Icon name="logout" size={ICON_SIZE} />}
        href="/logout"
      />
    </ul>
  );
}
