import classNames from "classnames";
import styles from "./Hint.module.css";

export default function Hint({
  type,
  children,
  className,
}: {
  type: "info" | "warn" | "error";
  children: React.ReactNode;
  className?: string;
}) {
  const icon = {
    error: "❌",
    info: "💡",
    warn: "⚠️",
  }[type];

  return (
    <div className={classNames(styles.hint, styles[type], className)}>
      <div className={styles.hintContent}>
        {icon && <span>{icon}</span>}
        {children}
      </div>
    </div>
  );
}
