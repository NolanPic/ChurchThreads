"use client";

import { useMemo } from "react";
import { getDOMPurify } from "@/app/utils/dompurify";
import { type Config } from "dompurify";

export interface SanitizedUserContentProps {
  html: string;
  className?: string;
  sanitizeOptions?: Config;
}

const SanitizedUserContent: React.FC<SanitizedUserContentProps> = ({
  html,
  className,
  sanitizeOptions,
}) => {
  const DOMPurify = getDOMPurify();

  const sanitizedHtml = useMemo(() => {
    let options = sanitizeOptions;
    if (!options) {
      options = {
        FORBID_TAGS: ["script", "style"],
      };
    }

    return html ? DOMPurify.sanitize(html, options) : "";
  }, [html, sanitizeOptions, DOMPurify]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};

export default SanitizedUserContent;
