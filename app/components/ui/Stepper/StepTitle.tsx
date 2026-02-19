import cx from "classnames";
import styles from "./StepTitle.module.css";

interface StepTitleProps {
  children: React.ReactNode;
  className?: string;
}

export default function StepTitle({ children, className }: StepTitleProps) {
  return (
    <h2 className={cx(styles.stepTitle, className)}>
      {children}
    </h2>
  );
}
