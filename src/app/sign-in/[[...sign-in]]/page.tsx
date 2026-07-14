import { SignIn } from "@clerk/nextjs";
import { clerkAuthAppearance } from "@/lib/clerk-auth-appearance";
import { DEFAULT_AUTH_DESTINATION } from "@/lib/app-navigation";

export default function SignInPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0E1219] p-4 sm:p-6">
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        fallbackRedirectUrl={DEFAULT_AUTH_DESTINATION}
        appearance={clerkAuthAppearance}
      />
    </main>
  );
}
