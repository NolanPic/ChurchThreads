"use client";

import { createContext, useState, useMemo, ReactNode } from "react";
import { Id } from "@/convex/_generated/dataModel";

export const CurrentFeedAndThreadContext = createContext<{
  feedId?: Id<"feeds">;
  threadId?: Id<"threads">;
  feedIdOfCurrentThread?: Id<"feeds">;
  setFeedId: (feedId?: Id<"feeds">) => void;
  setThreadId: (threadId?: Id<"threads">) => void;
  setFeedIdOfCurrentThread: (feedId?: Id<"feeds">) => void;
}>({
  feedId: undefined,
  threadId: undefined,
  feedIdOfCurrentThread: undefined,
  setFeedId: () => {},
  setThreadId: () => {},
  setFeedIdOfCurrentThread: () => {},
});

export function CurrentFeedAndThreadProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [feedId, setFeedId] = useState<Id<"feeds">>();
  const [threadId, setThreadId] = useState<Id<"threads">>();
  const [feedIdOfCurrentThread, setFeedIdOfCurrentThread] =
    useState<Id<"feeds">>();

  const contextValue = useMemo(
    () => ({
      feedId,
      threadId,
      feedIdOfCurrentThread,
      setFeedId,
      setThreadId,
      setFeedIdOfCurrentThread,
    }),
    [feedId, threadId, feedIdOfCurrentThread]
  );

  return (
    <CurrentFeedAndThreadContext.Provider value={contextValue}>
      {children}
    </CurrentFeedAndThreadContext.Provider>
  );
}
