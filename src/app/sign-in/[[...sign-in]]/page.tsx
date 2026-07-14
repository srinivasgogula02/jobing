import { SignIn } from "@clerk/nextjs";

const appearance = {
  variables: {
    colorPrimary: "#C6F24E",
    colorBackground: "#161B25",
    colorText: "#F2F4F7",
    colorTextSecondary: "#8B93A1",
    colorInputBackground: "#1F2531",
    colorInputText: "#F2F4F7",
    borderRadius: "0.75rem",
  },
} as const;

export default function SignInPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0E1219] p-4 sm:p-6">
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/tools"
        appearance={appearance}
      />
    </main>
  );
}
