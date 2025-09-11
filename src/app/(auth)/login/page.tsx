"use client";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <AuthCard
        title="Welcome back"
        subtitle="Access your budget dashboard."
        footer={{ text: "New here?", linkText: "Create an account", href: "/register" }}
      >
        <LoginForm />
      </AuthCard>
    </div>
  );
}
