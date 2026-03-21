import { DodoPayments } from "dodopayments";

const dodoPaymentsApiKey = process.env.DODO_PAYMENTS_API_KEY;
const dodoEnvironment = (process.env.DODO_PAYMENTS_ENVIRONMENT as "test_mode" | "live_mode") || "test_mode";

if (!dodoPaymentsApiKey) {
  throw new Error("DODO_PAYMENTS_API_KEY is not set in environment variables.");
}

export const dodo = new DodoPayments({
  bearerToken: dodoPaymentsApiKey,
  environment: dodoEnvironment,
});
