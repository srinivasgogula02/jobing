/**
 * DualMark markdown endpoint.
 *
 * The middleware rewrites `<path>.md`, AI-bot, and `Accept: text/markdown`
 * requests to `/md/<path>`, which this handler serves. Config lives in
 * `src/lib/dualmark.ts`.
 *
 * Rendering strategy: statically generate every known twin at build time, but
 * keep `dynamicParams` on with hourly revalidation so blog posts published after
 * a deploy get their markdown twin on first request (ISR) instead of 404ing.
 */
import { createDualmarkRouteHandler } from "@dualmark/nextjs";
import { dualmarkConfig } from "@/lib/dualmark";

const handler = createDualmarkRouteHandler(dualmarkConfig);

export const dynamic = "force-static";
export const dynamicParams = true;
export const revalidate = 3600;

export const GET = handler.GET;
export const generateStaticParams = handler.generateStaticParams;
