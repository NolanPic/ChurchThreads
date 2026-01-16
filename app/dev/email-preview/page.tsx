"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { render } from "@react-email/render";
import { NewThread } from "@/email/notifications/NewThread";
import { NewMessages } from "@/email/notifications/NewMessages";
import { UserJoinedFeed } from "@/email/notifications/UserJoinedFeed";
import mockData from "./mockData.json";
import React from "react";

function EmailPreviewContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const [emailHtml, setEmailHtml] = useState<string>("");

  useEffect(() => {
    if (!type) return;

    const renderEmail = async () => {
      let html = "";
      if (type === "new_thread_in_member_feed") {
        const data = mockData.new_thread_in_member_feed as React.ComponentProps<
          typeof NewThread
        >;
        html = await render(<NewThread {...data} />);
      } else if (type === "new_message_in_thread") {
        const data = mockData.new_message_in_thread as React.ComponentProps<
          typeof NewMessages
        >;
        html = await render(<NewMessages {...data} />);
      } else if (type === "new_feed_member") {
        const data = mockData.new_feed_member as React.ComponentProps<
          typeof UserJoinedFeed
        >;
        html = await render(<UserJoinedFeed {...data} />);
      }

      setEmailHtml(html);
    };

    renderEmail();
  }, [type]);

  // Check if in development
  if (process.env.NODE_ENV !== "development") {
    return (
      <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
        <h1>404 - Not Found</h1>
      </div>
    );
  }

  // TODO: Add admin authentication check

  if (!type) {
    return (
      <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
        <h1>Email Preview (Development Only)</h1>
        <p>Add type parameter to preview an email:</p>
        <ul>
          <li>
            <a href="?type=new_thread_in_member_feed">
              ?type=new_thread_in_member_feed
            </a>
          </li>
          <li>
            <a href="?type=new_message_in_thread">
              ?type=new_message_in_thread
            </a>
          </li>
          <li>
            <a href="?type=new_feed_member">?type=new_feed_member</a>
          </li>
        </ul>
      </div>
    );
  }

  if (!emailHtml) {
    return <div style={{ padding: "20px" }}>Loading...</div>;
  }

  return (
    <iframe
      srcDoc={emailHtml}
      style={{
        width: "100%",
        minHeight: "100vh",
        border: "none",
      }}
      title="Email Preview"
    />
  );
}

export default function EmailPreviewPage() {
  return (
    <Suspense fallback={<div style={{ padding: "20px" }}>Loading...</div>}>
      <EmailPreviewContent />
    </Suspense>
  );
}
