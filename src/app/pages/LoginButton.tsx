"use client";

import { SignInButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";

interface LoginButtonProps {
  redirectUrl: string;
}

export default function LoginButton({ redirectUrl }: LoginButtonProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <SignInButton mode="modal" forceRedirectUrl={redirectUrl}>
      <button className="px-4 py-2 bg-white text-black font-bold rounded-lg hover:bg-neutral-200 transition-colors">
        Log In
      </button>
    </SignInButton>
  );
}
