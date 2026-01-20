import styles from "./FeedSkeleton.module.css";

export default function FeedSkeleton() {
  return (
    <>
      {[...Array(6)].map((_, i) => (
        <article key={i} className={styles.skeletonPostWrapper}>
          <div className={styles.skeletonFeedPost}>
            <div className={`${styles.skeletonAvatar} ${styles.skeleton}`} />
            <div className={styles.skeletonPostRight}>
              <div className={styles.skeletonPostInfo}>
                <div
                  className={`${styles.skeletonAuthorName} ${styles.skeleton}`}
                />
                <div
                  className={`${styles.skeletonTimestamp} ${styles.skeleton}`}
                />
                <div
                  className={`${styles.skeletonMessageThread} ${styles.skeleton}`}
                />
              </div>
              <div
                className={`${styles.skeletonContentLine1} ${styles.skeleton}`}
              />
              <div
                className={`${styles.skeletonContentLine2} ${styles.skeleton}`}
              />
            </div>
          </div>
        </article>
      ))}
    </>
  );
}
