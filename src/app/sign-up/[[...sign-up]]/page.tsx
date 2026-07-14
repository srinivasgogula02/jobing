import { SignUp } from "@clerk/nextjs";
import { clerkAuthAppearance } from "@/lib/clerk-auth-appearance";

export default function SignUpPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0E1219] p-4 sm:p-6">
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/tools"
        appearance={clerkAuthAppearance}
      />
    </main>
  );
}
