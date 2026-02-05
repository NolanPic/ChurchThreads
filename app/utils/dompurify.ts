import DOMPurify from "dompurify";

const ALLOWED_IFRAME_PREFIXES = [
    "https://www.youtube.com/embed/",
    "https://www.youtube-nocookie.com/embed/",
];

let initialized = false;

export function getDOMPurify() {
    if (!initialized) {
      DOMPurify.addHook("afterSanitizeAttributes", (node) => {
        if ("href" in node) {
          node.setAttribute("target", "_blank");
          node.setAttribute("rel", "noopener noreferrer");
        }
      });
      DOMPurify.addHook("uponSanitizeElement", (node, data) => {
        if (data.tagName === "iframe") {
          const el = node as Element;
          const src = el.getAttribute("src") || "";
          const isAllowed = ALLOWED_IFRAME_PREFIXES.some((prefix) =>
            src.startsWith(prefix)
          );
          if (!isAllowed) {
            el.remove();
          }
        }
      });
      initialized = true;
    }
    return DOMPurify;
  }