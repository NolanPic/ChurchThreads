import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { ConvexReactClient, ConvexProvider } from "convex/react";
import Feed from "../feeds/Feed";
import { config } from "dotenv";

config({ path: ".env.local" });

const convexClient = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function ConvexTestProvider({ children }: { children: React.ReactNode }) {
  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>;
}

export function renderWithConvex(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, {
    wrapper: ConvexTestProvider,
    ...options,
  });
}

export function FeedWithOrg() {
  return <Feed feedIdSlug={null} />;
}

export * from "@testing-library/react";
export { renderWithConvex as render };
