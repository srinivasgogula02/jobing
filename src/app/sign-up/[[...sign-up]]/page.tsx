import { SignUp } from "@clerk/nextjs";
import { clerkAuthAppearance } from "@/lib/clerk-auth-appearance";
import { DEFAULT_AUTH_DESTINATION } from "@/lib/app-navigation";

export default function SignUpPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0E1219] p-4 sm:p-6">
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        fallbackRedirectUrl={DEFAULT_AUTH_DESTINATION}
        appearance={clerkAuthAppearance}
      />
    </main>
  );
}
