import { ReactNode } from "react";
import styles from "./Card.module.css";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return <div className={`${styles.card} ${className}`.trim()}>{children}</div>;
}

export function CardHeader({ children, className = "" }: CardProps) {
  return (
    <div className={`${styles.cardHeader} ${className}`.trim()}>{children}</div>
  );
}

export function CardBody({ children, className = "" }: CardProps) {
  return (
    <div className={`${styles.cardBody} ${className}`.trim()}>{children}</div>
  );
}

export default Card;
