import { Id } from "@/convex/_generated/dataModel";
import Feed from "../components/Feed";

export default async function App({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;

  let feedId: Id<"feeds"> | null = null;
  let threadId: Id<"threads"> | null = null;
  let feedSettingsFeedId: Id<"feeds"> | null = null;

  if (slug && slug[0] === "feed" && slug[1]) {
    feedId = slug[1] as Id<"feeds">;
    // Check if this is a feed settings route: /feed/{feedId}/settings
    if (slug[2] === "settings") {
      feedSettingsFeedId = slug[1] as Id<"feeds">;
    }
  }
  if (slug && slug[0] === "thread" && slug[1]) {
    threadId = slug[1] as Id<"threads">;
  }

  return (
    <Feed
      feedIdSlug={feedId}
      threadIdSlug={threadId}
      feedSettingsFeedIdSlug={feedSettingsFeedId}
    />
  );
}
