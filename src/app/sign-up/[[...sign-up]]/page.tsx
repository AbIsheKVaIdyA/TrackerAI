import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/enter"
        fallbackRedirectUrl="/enter"
      />
    </div>
  );
}
