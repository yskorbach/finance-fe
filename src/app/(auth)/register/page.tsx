"use client";
import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <AuthCard
        title="Create your account"
        subtitle="Plan your budget smarter."
        footer={{ text: "Already have an account?", linkText: "Log in", href: "/login" }}
      >
        <RegisterForm />
      </AuthCard>
    </div>
  );
}
