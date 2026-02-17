
import { inngest } from "../client";
import { createClient } from "@/utils/supabase/server"; // Or admin client if preferred
import { sendExpiryWarning } from "@/lib/notifications";
import { createAdminClient } from "@/utils/supabase/admin";

// Define the function
export const sendExpiryWarnings = inngest.createFunction(
    { id: "send-expiry-warnings" },
    // Run every 15 minutes
    { cron: "*/15 * * * *" },
    async ({ step }) => {
        const expiringSessions = await step.run("fetch-expiring-sessions", async () => {
            const supabase = createAdminClient();
            const now = new Date();

            // CRON runs every 15 minutes.
            // We search from NOW+5m to NOW+30m to ensure we catch everything with overlap.
            // Overlap is safe because we filter by `warning_sent: false`.

            const windowStart = new Date(now.getTime() + 5 * 60 * 1000);  // 5 mins from now
            const windowEnd = new Date(now.getTime() + 30 * 60 * 1000);   // 30 mins from now

            console.log(`[Inngest] Checking expiry between ${windowStart.toISOString()} and ${windowEnd.toISOString()}`)

            const { data, error } = await (supabase
                .from("sessions") as any)
                .select("*, properties(name, timezone, allocation_mode)")
                .eq("status", "ACTIVE")
                .gte("end_time_current", windowStart.toISOString())
                .lte("end_time_current", windowEnd.toISOString())
                .eq("warning_sent", false)

            if (error) throw error;
            return data || [];
        });

        if (expiringSessions.length === 0) {
            return { message: "No sessions expiring soon" };
        }

        // 2. Send Warnings
        const results = await step.run("dispatch-warnings", async () => {
            const supabase = createAdminClient();
            const results = [];

            for (const session of expiringSessions) {
                console.log(`[Inngest] Sending warning for session ${session.id}`);

                const link = `${process.env.NEXT_PUBLIC_APP_URL || 'https://cashphalt.com'}/pay/extend/${session.id}`;
                const propertyName = (session.properties as any)?.name || 'Parking Lot';
                const timezone = (session.properties as any)?.timezone || 'UTC';

                // Fetch unit name
                let unitName = null
                // @ts-ignore db-types mismatch
                if (session.spot_id) {
                    const { data: unit } = await (supabase
                        .from('parking_units') as any)
                        .select('name')
                        // @ts-ignore
                        .eq('id', session.spot_id)
                        .single()
                    if (unit) unitName = unit.name
                }

                await sendExpiryWarning({
                    toEmail: session.customer_email,
                    toPhone: session.customer_phone,
                    plate: session.vehicle_plate || 'Unknown',
                    propertyName,
                    unitName,
                    expireTime: new Date(session.end_time_current),
                    link,
                    timezone,
                    allocationMode: (session.properties as any)?.allocation_mode || 'SPOT'
                });

                // Mark as sent to prevent duplicates
                await (supabase.from('sessions') as any)
                    .update({ warning_sent: true })
                    .eq('id', session.id)

                results.push({ id: session.id, status: 'warning_sent' });
            }
            return results;
        });

        return { processed: results.length };
    }
);
