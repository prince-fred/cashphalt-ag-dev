import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";

// We will add functions here later (e.g. for background jobs)
export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [],
});
