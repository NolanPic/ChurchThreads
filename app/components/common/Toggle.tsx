import { useId } from "react";
import styles from "./Toggle.module.css";

export interface ToggleProps {
  value: boolean;
  onToggle: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  id?: string;

  /** for accessibility when no visible label */
  ariaLabel?: string;
}

const Toggle = ({
  value,
  onToggle,
  label,
  disabled = false,
  className = "",
  id,
  ariaLabel,
}: ToggleProps) => {
  const generatedId = useId();
  const toggleId = id || `toggle-${generatedId}`;
  const labelId = label ? `${toggleId}-label` : undefined;

  const handleToggle = () => {
    if (!disabled) {
      onToggle(!value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Space and Enter should toggle
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={`${styles.toggleWrapper} ${className}`.trim()}>
      {label && (
        <label htmlFor={toggleId} className={styles.label} id={labelId}>
          {label}
        </label>
      )}

      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={value}
        aria-labelledby={labelId}
        aria-label={!label ? ariaLabel : undefined}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`${styles.toggle} ${value ? styles.on : styles.off}`.trim()}
      >
        <span className={styles.track}>
          <span className={styles.thumb} />
        </span>
      </button>
    </div>
  );
};

Toggle.displayName = "Toggle";
export default Toggle;
