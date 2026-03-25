import crypto from 'crypto';

// The Pixel ID was extracted from your existing layout.tsx tracking code.
const META_PIXEL_ID = '932694869167270';
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

/**
 * Standardizes and hashes PII parameters according to Meta's strict rules:
 * 1. Trim leading/trailing whitespace
 * 2. Convert to lowercase
 * 3. SHA-256 hash
 */
function hashMetaParam(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Sends a Purchase event to the Meta Conversions API.
 * This is designed to be called securely from a server environment (e.g. your webhook).
 */
export async function sendMetaPurchaseEvent(paymentData: any) {
  try {
    const eventTime = Math.floor(Date.now() / 1000);
    
    // Extract tunneled pass-through metadata that we injected during checkout
    const metadata = paymentData.metadata || {};
    
    // Extract customer details provided by the payment platform (Dodo)
    const email = paymentData.customer?.email;
    const customerName = paymentData.customer?.name || '';
    
    // Dodo might present names together; split aggressively for Meta `fn` and `ln`
    const nameParts = customerName.split(' ').map((n: string) => n.trim()).filter(Boolean);
    const firstName = nameParts[0] || undefined;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined;

    // Dodo total_amount usually represents the lowest fractional amount (like cents)
    // However, if the store processes major units cleanly, we can map securely by product ID.
    // Dodo payload `currency` is typically 3-letter ISO code.
    const currency = (paymentData.currency || 'INR').toUpperCase();
    
    // Get the product details from the payment (assuming 1 item in cart)
    const productCart = paymentData.product_cart && paymentData.product_cart[0];
    const productId = productCart?.product_id;
    
    // Safe fallback value mapping based on Product IDs used in Pricing component
    let value = 0;
    if (productId === process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PRO) {
      value = 249;
    } else if (productId === process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_ELITE) {
      value = 499;
    } else {
      // In case we don't match our exact IDs, rely on Dodo's value but divide by 100 assuming cents formulation
      value = (paymentData.total_amount || 0) / 100;
      if (value === 0) value = paymentData.settlement_amount || 0;
    }

    // Build the `user_data` dynamically handling existence checks
    const userData: Record<string, any> = {
      // Direct pass-through identifiers (Strictly DO NOT HASH per Meta)
      client_ip_address: metadata.client_ip || undefined,
      client_user_agent: metadata.client_user_agent || undefined,
      fbp: metadata.fbp || undefined,
      fbc: metadata.fbc || undefined,

      // External System ID (We hash the Clerk ID to protect the platform's primary key mapping)
      external_id: metadata.clerk_user_id ? [hashMetaParam(metadata.clerk_user_id)] : undefined,
    };

    // Hashed Customer PII properties
    if (email) userData.em = [hashMetaParam(email)];
    if (firstName) userData.fn = [hashMetaParam(firstName)];
    if (lastName) userData.ln = [hashMetaParam(lastName)];
    
    // Clean out undefined keys from the payload payload
    const cleanUserData = Object.fromEntries(
      Object.entries(userData).filter(([_, v]) => typeof v !== 'undefined')
    );

    // Build the final CAPI payload
    const payload = {
      data: [
         {
           event_name: 'Purchase',
           event_time: eventTime,
           action_source: 'website',
           // Default fallback URL if we don't capture the exact referral
           event_source_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://jobing.site'}/pricing`,
           event_id: paymentData.payment_id, // Deduplication key
           user_data: cleanUserData,
           custom_data: {
             currency: currency,
             value: value,
             content_ids: productId ? [productId] : undefined,
             content_type: 'product',
             num_items: 1,
           }
         }
      ]
    };

    console.log('[Meta CAPI] Dispatching Purchase event for ID:', paymentData.payment_id);

    const response = await fetch(`https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        access_token: META_ACCESS_TOKEN
      })
    });

    const result = await response.json();
    
    if (result.error) {
      console.error('[Meta CAPI] Event rejected by Meta:', result.error);
    } else if (result.events_received) {
      console.log(`[Meta CAPI] Purchase successfully logged. Events Received: ${result.events_received}`);
    } else {
      console.log(`[Meta CAPI] Unexpected response:`, result);
    }
  } catch (error) {
    // We catch and isolate failures so the webhook itself never crashes and restarts Dodo loops.
    console.error('[Meta CAPI] Critical execution error:', error);
  }
}
