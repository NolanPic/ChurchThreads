import styles from "./FeedSkeleton.module.css";

export default function FeedSkeleton() {
  return (
    <>
      {[...Array(6)].map((_, i) => (
        <article key={i} className={styles.skeletonPostWrapper}>
          <div className={styles.skeletonThread}>
            {/* Avatar */}
            <div className={`${styles.skeletonAvatar} ${styles.skeleton}`} />

            {/* Author Name */}
            <div className={`${styles.skeletonAuthorName} ${styles.skeleton}`} />

            {/* Metadata (timestamp) */}
            <div className={`${styles.skeletonMetadata} ${styles.skeleton}`} />

            {/* Thread Menu placeholder */}
            <div className={styles.skeletonThreadMenu} />

            {/* Message Thread button */}
            <div className={`${styles.skeletonMessageThread} ${styles.skeleton}`} />

            {/* Content lines */}
            <div className={styles.skeletonContent}>
              <div className={`${styles.skeletonContentLine1} ${styles.skeleton}`} />
              <div className={`${styles.skeletonContentLine2} ${styles.skeleton}`} />
            </div>
          </div>
        </article>
      ))}
    </>
  );
}
