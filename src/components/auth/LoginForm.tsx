"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {api, ApiError} from "@/lib/api";

const loginSchema = z.object({
  email: z.email("Please provide a valid email address"),
  password: z.string().min(1, "Enter your password")
});
type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const nextUrl = sp.get("next") ?? "/dashboard";

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { email: "", password: "" },
  });


  type LoginResponse = { token: string; user?: { id: number; email: string } };

  const mutation = useMutation({
    mutationFn: async (values: LoginValues) => {
      const res = await api.post<LoginResponse>("/api/auth/login", values); //
      const token = res.data?.token;
      if (!token) {
        throw { status: 500, message: "Missing access token in response" } as ApiError;
      }
      api.saveToken(token);
      return { next: nextUrl };
    },
    onSuccess: ({next}) => router.replace(next),
    onError: (err: any) => {
      if (err?.status === 401) {
        form.setError("root", { message: "Incorrect login details" });
      } else {
        form.setError("root", { message: err?.message || "Failed to log in. Please try again." });
      }
    },
  });

  const onSubmit = (values: LoginValues) => mutation.mutate(values);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" aria-hidden />
                  <Input type="email" placeholder="you@example.com" className="pl-9" autoComplete="email" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hasło</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" aria-hidden />
                  <Input type="password" className="pl-9" autoComplete="current-password" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root?.message ? (
          <p role="alert" className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        ) : null}

        <Button type="submit" variant="secondary" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Logging in…
            </span>
          ) : (
            "Login"
          )}
        </Button>
      </form>
    </Form>
  );
}
