import Image from "next/image";
import Link from "next/link";
import styles from "./FeedFooter.module.css";

const FeedFooter = () => (
  <>
    <footer>
      <Link
        href="https://churchthreads.net/"
        target="_blank"
        className={styles.logo}
      >
        <Image
          src="/logo.svg"
          width="26"
          height="25"
          alt="churchthreads logo"
        />
        <p>
          church<span>threads</span>
        </p>
      </Link>
    </footer>
  </>
);

export default FeedFooter;
