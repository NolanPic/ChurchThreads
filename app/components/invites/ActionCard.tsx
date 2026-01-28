import styles from "./ActionCard.module.css";
import Card from "@/app/components/ui/Card";
import Icon from "@/app/components/ui/Icon";
import classnames from "classnames";

interface ActionCardProps {
  title?: string;
  titleIcon?: string;
  description?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default function ActionCard({
  title,
  titleIcon,
  description,
  onClick,
  disabled,
  className,
  children,
}: ActionCardProps) {
  const useShortCard = !description && !children;

  const card = (
    <Card className={styles.card}>
      {title && (
        <div className={styles.title}>
          <h2>{title}</h2>
          {titleIcon && <Icon name={titleIcon} size={24} />}
        </div>
      )}
      {description && <p className={styles.description}>{description}</p>}
      {children}
    </Card>
  );

  return (
    <div
      className={classnames(styles.cardWrapper, className, {
        [styles.shortCard]: useShortCard,
      })}
    >
      {onClick ? (
        <button
          type="button"
          className={styles.actionButton}
          onClick={onClick}
          disabled={!!disabled}
        >
          {card}
        </button>
      ) : (
        card
      )}
    </div>
  );
}
