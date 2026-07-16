import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent, clerkClient } from '@clerk/nextjs/server'
import { getPostHogClient } from '@/lib/posthog-server'
import { enqueueAndDeliverUserDeletion } from '@/lib/forms-projection-outbox'
import { captureProductEvent } from '@/lib/product-telemetry'

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

    if (!WEBHOOK_SECRET) {
        throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
    }

    // Get the headers
    const headerPayload = await headers()
    const svix_id = headerPayload.get('svix-id')
    const svix_timestamp = headerPayload.get('svix-timestamp')
    const svix_signature = headerPayload.get('svix-signature')

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error occured -- no svix headers', {
            status: 400,
        })
    }

    // Get the body
    const body = await req.text()

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET)

    let evt: WebhookEvent

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            'svix-id': svix_id,
            'svix-timestamp': svix_timestamp,
            'svix-signature': svix_signature,
        }) as WebhookEvent
    } catch (err) {
        console.error('Error verifying webhook:', err)
        return new Response('Error verifying webhook signature', {
            status: 400,
        })
    }

    const eventType = evt.type

    if (eventType === 'user.created' || eventType === 'user.updated') {
        const { id, username, first_name, last_name, image_url, email_addresses, primary_email_address_id } = evt.data
        const name = [first_name, last_name].filter(Boolean).join(' ')

        const primaryEmail = (email_addresses || []).find(
            (email) => email.id === primary_email_address_id
        )?.email_address || (email_addresses || [])[0]?.email_address || null

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

        if (!supabaseServiceKey) {
            console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
            return new Response('Server configuration error: Missing SUPABASE_SERVICE_ROLE_KEY', { status: 500 });
        }

        const { createClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        const userData: {
            id: string;
            username: string | null;
            name: string;
            image_url: string;
            credits?: number;
        } = {
            id,
            username,
            name,
            image_url,
        };

        if (eventType === 'user.created') {
            userData.credits = 2; // Every user gets 2 free credits
        }

        const { error } = await supabaseAdmin
            .from('users')
            .upsert(userData);

        if (error) {
            console.error('Error syncing user to Supabase:', error)
            return new Response(`Error syncing user to Supabase: ${error.message} (Code: ${error.code})`, { status: 500 })
        }

        // Keep the email marketing list fresh. Only upsert the email/name; never
        // reset status or last_emailed_at for an existing subscriber.
        if (primaryEmail) {
            const { error: subError } = await supabaseAdmin
                .from('email_subscribers')
                .upsert(
                    {
                        clerk_user_id: id,
                        email: primaryEmail,
                        name: name || null,
                        source: 'clerk',
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'email' }
                )
            if (subError) {
                console.error('Error syncing email_subscribers:', subError)
            }
        }

        // Always sync has_credits to Clerk on new user creation
        if (eventType === 'user.created' && id) {
            try {
                const client = await clerkClient();
                await client.users.updateUserMetadata(id, {
                    publicMetadata: { has_credits: true }
                });
                console.log(`[Clerk Webhook] Synced has_credits=true for new user ${id}`);
            } catch (clerkErr) {
                console.error('[Clerk Webhook] Error syncing has_credits to Clerk:', clerkErr);
            }

            const posthog = getPostHogClient();
            if (posthog) {
                const results = await Promise.allSettled([
                    posthog.identifyImmediate({
                        distinctId: id,
                        properties: { plan_key: 'free', signup_source: 'clerk' },
                    }),
                ]);
                for (const result of results) {
                    if (result.status === 'rejected') console.error('PostHog delivery failed:', result.reason);
                }
            }
            captureProductEvent({ event: 'user_signed_up', distinctId: id, properties: { source: 'clerk', plan_key: 'free', product_area: 'account' } });
        }
    }

    if (eventType === 'user.deleted') {
        const { id } = evt.data

        if (id) {
            try {
                const webhookSeconds = Number(svix_timestamp)
                const sourceVersion = Number.isSafeInteger(webhookSeconds) && webhookSeconds > 0
                    ? webhookSeconds * 1000
                    : Date.now()
                await enqueueAndDeliverUserDeletion({
                    userId: id,
                    eventKey: svix_id,
                    sourceVersion,
                })
            } catch (deletionError) {
                // The Supabase outbox remains durable if the Neon delivery is
                // unavailable. A 500 also asks Svix to retry the same event.
                console.error('Error processing user deletion:', deletionError instanceof Error ? { name: deletionError.name } : { type: typeof deletionError })
                return new Response('Error processing user deletion', { status: 500 })
            }
        }
    }

    return new Response('', { status: 200 })
}
