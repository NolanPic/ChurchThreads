import Link from "next/link";
import styles from "./Button.module.css";
import Icon from "./Icon";
import { forwardRef } from "react";

interface BaseButtonProps {
  children?: React.ReactNode;
  icon?: React.ReactNode | string;
  className?: string;
  disabled?: boolean;
  variant?: "primary" | "none";
  iconSize?: number;
  ariaLabel?: string;
  noBackground?: boolean;
  style?: React.CSSProperties;
  popoverTarget?: string;
}

interface ButtonAsButton extends BaseButtonProps {
  as?: "button";
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  type?: "button" | "submit";
  href?: never;
}

interface ButtonAsLink extends BaseButtonProps {
  as: "link";
  href: string;
  onClick?: never;
  type?: never;
}

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    icon,
    className = "",
    disabled = false,
    variant,
    iconSize,
    ariaLabel,
    noBackground = false,
    style,
    popoverTarget,
    ...props
  },
  ref
) {
  const hasChildren = !!children;
  const variantClassName =
    variant === "primary" ? styles.variantPrimary : styles.variantDefault;
  const iconOnlyClassName = !hasChildren ? styles.iconOnly : "";
  const baseClassName =
    `${styles.button} ${variantClassName} ${iconOnlyClassName} ${className} ${noBackground ? styles.noBackground : ""}`.trim();

  const ButtonContent = () => (
    <>
      {hasChildren && <span>{children}</span>}
      {icon && (
        <>
          {typeof icon === "string" ? (
            <Icon className={styles.icon} name={icon} size={iconSize} />
          ) : (
            icon
          )}
        </>
      )}
    </>
  );

  if ((props as ButtonAsLink).as === "link") {
    return (
      <Link
        href={(props as ButtonAsLink).href}
        className={baseClassName}
        style={style}
        aria-disabled={disabled}
        aria-label={ariaLabel}
      >
        <ButtonContent />
      </Link>
    );
  }

  const { onClick, type } = props as ButtonAsButton;

  return (
    <button
      ref={ref}
      type={type || "button"}
      onClick={onClick}
      disabled={disabled}
      className={baseClassName}
      style={style}
      aria-label={ariaLabel}
      popoverTarget={popoverTarget}
    >
      <ButtonContent />
    </button>
  );
});

export default Button;
