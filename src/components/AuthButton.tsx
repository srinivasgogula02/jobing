"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import type { ReactNode } from "react";

interface AuthButtonProps {
    mode: "sign-in" | "sign-up";
    className?: string;
    children: ReactNode;
}

/**
 * Client wrapper for Clerk's <SignInButton>/<SignUpButton>.
 *
 * These control components run React.Children.only() on their direct child.
 * When a Server Component passes a custom <button> child across the RSC
 * boundary, that check throws "You've passed multiple children components".
 * Constructing the <button> inside this client component guarantees Clerk
 * receives a single, normal client-side element as its child.
 */
export function AuthButton({ mode, className, children }: AuthButtonProps) {
    if (mode === "sign-in") {
        return (
            <SignInButton forceRedirectUrl="/tools">
                <button className={className}>{children}</button>
            </SignInButton>
        );
    }

    return (
        <SignUpButton forceRedirectUrl="/tools">
            <button className={className}>{children}</button>
        </SignUpButton>
    );
}
