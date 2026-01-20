import Button, { ButtonProps } from "./Button";
import styles from "./IconButton.module.css";
import classNames from "classnames";
import { forwardRef } from "react";

type IconButtonProps = Omit<ButtonProps, "variant"> & {
  variant?: "primary" | "default";
  label?: string;
  size?: number;
  popoverTarget?: string;
};

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      icon,
      variant = "default",
      label,
      size = 56,
      iconSize = 24,
      className = "",
      ariaLabel,
      popoverTarget,
      ...props
    }: IconButtonProps,
    ref
  ) {
    const classes = classNames(
      styles.iconButton,
      variant === "default" ? styles.defaultVariant : styles.primaryVariant,
      label && styles.hasLabel,
      className
    );

    const buttonVariant: ButtonProps["variant"] =
      variant === "primary" ? "primary" : "none";

    type IconButtonStyle = React.CSSProperties &
      Record<"--iconButtonSize", string>;
    const iconButtonStyle: IconButtonStyle = {
      "--iconButtonSize": `${size}px`,
    };

    const { style, ...restProps } = props;

    return (
      <Button
        ref={ref}
        {...(restProps as ButtonProps)}
        icon={icon}
        iconSize={iconSize}
        variant={buttonVariant}
        ariaLabel={ariaLabel || label}
        className={classes}
        style={{ ...style, ...iconButtonStyle }}
        popoverTarget={popoverTarget}
      >
        {label}
      </Button>
    );
  }
);

export default IconButton;
