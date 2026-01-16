import { Img } from "@react-email/components";
import React from "react";

interface AvatarProps {
  imageUrl: string;
  size: 34 | 80;
}

export const Avatar: React.FC<AvatarProps> = ({ imageUrl, size }) => {
  return (
    <Img
      src={imageUrl}
      alt="Avatar"
      width={size}
      height={size}
      style={{
        borderRadius: "50%",
        objectFit: "cover" as const,
      }}
    />
  );
};
