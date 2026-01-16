import { Doc, Id } from "@/convex/_generated/dataModel";
import Image from "next/image";
import styles from "./UserAvatar.module.css";
import classNames from "classnames";

const getAuthorInitialsAvatar = (authorName?: string) => {
  const initials = authorName
    ?.split(" ")
    .map((name) => name[0])
    .join("");
  return initials;
};

type AvatarUser =
  | { _id: Id<"users">; name: string; image: string | null }
  | (Omit<Doc<"users">, "image"> & { image: string | null });

interface UserAvatarProps {
  user: AvatarUser;
  size?: number;
  highlight?: boolean;
  imageUploadPreview?: string | null;
}

const UserAvatar = ({
  user,
  size,
  highlight,
  imageUploadPreview,
}: UserAvatarProps) => {
  const { name, image } = user;

  const avatar = image ? (
    size ? (
      <Image
        src={imageUploadPreview || image}
        alt={name}
        width={size}
        height={size}
      />
    ) : (
      <Image src={imageUploadPreview || image} alt={name} fill />
    )
  ) : (
    <div>{getAuthorInitialsAvatar(name)}</div>
  );

  return (
    <div
      className={classNames(styles.userAvatar, highlight && styles.highlight)}
      style={{ width: size, height: size }}
    >
      {avatar}
    </div>
  );
};

export default UserAvatar;
