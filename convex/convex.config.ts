import { defineApp } from "convex/server";
import resend from "@convex-dev/resend/convex.config.js";

const app = defineApp();

app.use(resend, { name: "resend" });

export default app;
