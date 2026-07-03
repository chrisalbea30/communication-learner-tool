import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Create account · Fluent" };

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Pick a username and password to get started."
    >
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
