import { Button as ReactEmailButton } from "@react-email/components";
import React from "react";

interface EmailButtonProps {
  children: React.ReactNode;
  url: string;
}

export const Button: React.FC<EmailButtonProps> = ({ children, url }) => {
  return (
    <ReactEmailButton
      href={url}
      style={{
        backgroundColor: "#F6B17A",
        color: "#424769",
        fontFamily: "Lato, sans-serif",
        fontSize: "16px",
        fontWeight: 700,
        borderRadius: "12px",
        padding: "12px 24px",
        textDecoration: "none",
        display: "inline-block",
        lineHeight: "30px",
        textAlign: "center" as const,
      }}
    >
      {children}
    </ReactEmailButton>
  );
};
