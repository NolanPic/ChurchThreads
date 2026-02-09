import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { components } from "./_generated/api";
import { Resend } from "@convex-dev/resend";
import { uploadFile } from "./uploadAction";

const http = httpRouter();
const resend = new Resend(components.resend, { testMode: false });

// Handle preflight OPTIONS request
http.route({
  path: "/upload",
  method: "OPTIONS",
  handler: httpAction(async (ctx, request) => {
    // Check that this is a valid CORS preflight request
    const headers = request.headers;
    if (
      headers.get("Origin") !== null &&
      headers.get("Access-Control-Request-Method") !== null &&
      headers.get("Access-Control-Request-Headers") !== null
    ) {
      return new Response(null, {
        headers: new Headers({
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        }),
      });
    }
    return new Response();
  }),
});

// File upload endpoint (CORS headers are added in uploadAction.ts)
http.route({
  path: "/upload",
  method: "POST",
  handler: uploadFile,
});

http.route({
  path: "/resend-webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    return await resend.handleResendEventWebhook(ctx, req);
  }),
});

export default http;
