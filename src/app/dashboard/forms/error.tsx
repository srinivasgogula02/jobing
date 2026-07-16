"use client";

export default function FormsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="forms-workspace"><section className="app-content"><div className="forms-route-error" role="alert"><p className="eyebrow">Forms unavailable</p><h1>Your forms are safe.</h1><p>The inbox could not load right now. Check your connection and try again.</p><button className="button button--primary" type="button" onClick={reset}>Try again</button></div></section></div>;
}
