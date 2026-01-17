import UserAvatar from "./UserAvatar";
import { useUserAuth } from "@/auth/client/useUserAuth";
import styles from "./UserAvatarMenu.module.css";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface UserAvatarMenuProps {
  openProfileModal: () => void;
}
const UserAvatarMenu = ({ openProfileModal }: UserAvatarMenuProps) => {
  const [, { user, signOut }] = useUserAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);

  if (!user) {
    return null;
  }

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={styles.userAvatarMenu}>
      <button onClick={() => setIsOpen(!isOpen)}>
        <UserAvatar user={user} size={54} highlight={true} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.ul
              className={styles.userAvatarMenuList}
              style={isOpen ? { zIndex: 2 } : {}}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.1 }}
              ref={menuRef as React.RefObject<HTMLUListElement>}
            >
              <li className={styles.userAvatarMenuItem}>
                <button
                  type="button"
                  onClick={() => {
                    openProfileModal();
                    setIsOpen(false);
                  }}
                >
                  Profile
                </button>
              </li>
              <li className={styles.userAvatarMenuItem}>
                <button
                  type="button"
                  onClick={() => {
                    signOut({
                      redirectUrl: "/",
                    });
                  }}
                >
                  Sign out
                </button>
              </li>
            </motion.ul>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserAvatarMenu;
