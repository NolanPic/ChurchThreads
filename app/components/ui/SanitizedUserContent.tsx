"use client";

import { useMemo } from "react";
import { getDOMPurify } from "@/app/utils/dompurify";
export interface SanitizedUserContentProps {
  html: string;
  className?: string;
}

const SanitizedUserContent: React.FC<SanitizedUserContentProps> = ({
  html,
  className,
}) => {
  const DOMPurify = getDOMPurify();

  const sanitizedHtml = useMemo(() => {
    let options = {
      FORBID_TAGS: ["script", "style"],
      ADD_TAGS: ["iframe"],
      ADD_ATTR: [
        "allow",
        "allowfullscreen",
        "frameborder",
        "src",
        "width",
        "height",
        "data-youtube-video",
      ],
    };

    return html ? DOMPurify.sanitize(html, options) : "";
  }, [html, DOMPurify]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};

export default SanitizedUserContent;
