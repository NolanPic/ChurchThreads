import styles from "./ActionCard.module.css";
import Card from "@/app/components/ui/Card";
import Icon from "@/app/components/ui/Icon";
import classnames from "classnames";

interface ActionCardProps {
  title?: string;
  titleIcon?: string;
  description?: string;
  onClick?: () => void;
  disabled?: Boolean;
  children?: React.ReactNode;
}

export default function ActionCard({
  title,
  titleIcon,
  description,
  onClick,
  disabled,
  children,
}: ActionCardProps) {
  const useShortCard = !description && !children;

  const card = (
    <Card
      className={classnames(styles.card, {
        [styles.isDisabled]: disabled,
        [styles.shortCard]: useShortCard,
      })}
    >
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

  return onClick ? (
    <button type="button" className={styles.actionButton} onClick={onClick}>
      {card}
    </button>
  ) : (
    card
  );
}
