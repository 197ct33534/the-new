import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
  const hasGoogle = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-10">
      <SignInForm hasGoogle={hasGoogle} />
    </div>
  );
}
