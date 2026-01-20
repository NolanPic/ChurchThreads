import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { ConvexReactClient, ConvexProvider, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
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
  const testOrgHost = global.TEST_ORG_HOST;
  const subdomain = testOrgHost.split(".")[0];

  const org = useQuery(api.organizations.getOrganizationBySubdomain, {
    subdomain: subdomain,
  });

  if (org === undefined) {
    return <div data-testid="loading">Loading...</div>;
  }

  if (org === null) {
    return <div data-testid="error">Org not found</div>;
  }

  return <Feed orgId={org._id} />;
}

export * from "@testing-library/react";
export { renderWithConvex as render };
