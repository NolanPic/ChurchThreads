import { Id } from "@/convex/_generated/dataModel";
import UserAvatar from "../UserAvatar";
import styles from "./StackedUsers.module.css";

type AvatarUser = {
  _id: Id<"users">;
  name: string;
  image: string | null;
};

interface StackedUsersProps {
  users: AvatarUser[];
  numberOfAvatarsToShow: number;
  showRemainingCount: boolean;
}

const StackedUsers = ({
  users,
  numberOfAvatarsToShow,
  showRemainingCount,
}: StackedUsersProps) => {
  const displayedUsers = users.slice(0, numberOfAvatarsToShow);
  const remainingCount = users.length - numberOfAvatarsToShow;

  return (
    <div className={styles.stackedUsers}>
      <div className={styles.avatarsContainer}>
        {displayedUsers.map((user) => (
          <div key={user._id} className={styles.avatarWrapper}>
            <UserAvatar user={user} size={34} highlight />
          </div>
        ))}
      </div>
      {showRemainingCount && remainingCount > 0 && (
        <span className={styles.remainingCount}>+{remainingCount}</span>
      )}
    </div>
  );
};

export default StackedUsers;
