import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import * as v from "valibot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/lib/orpc";
import { AuthShell } from "./-components/auth-shell";

export const Route = createFileRoute("/_login/sign-up")({
  component: SignUp,
});

function SignUp() {
  const navigate = useNavigate({ from: "/" });
  const session = authClient.useSession();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signUp.email(
        {
          email: value.email,
          password: value.password,
          name: value.name,
        },
        {
          onSuccess: () => {
            queryClient.clear();
            void session.refetch();
            void navigate({ to: "/dashboard" });
            toast.success("Sign up successful");
          },
          onError: (error) => {
            toast.error(error.error.message);
          },
        },
      );
    },
    validators: {
      onSubmit: v.object({
        name: v.pipe(v.string(), v.minLength(2, "Name must be at least 2 characters")),
        email: v.pipe(v.string(), v.email("Invalid email address")),
        password: v.pipe(v.string(), v.minLength(8, "Password must be at least 8 characters")),
      }),
    },
  });

  return (
    <AuthShell
      eyebrow="Get started"
      title="Create your account"
      description="Set up your dashboard in seconds. Start tracking real-time presence across all your applications."
      footerPrompt="Already have an account?"
      footerTo="/sign-in"
      footerLabel="Sign in"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
        className="space-y-5"
      >
        <form.Field name="name">
          {(field) => (
            <div className="space-y-2">
              <Label
                htmlFor={field.name}
                className="text-xs tracking-widest text-white/50 uppercase"
              >
                Name
              </Label>
              <Input
                id={field.name}
                name={field.name}
                placeholder="Jane Smith"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-sm text-destructive">
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Field name="email">
          {(field) => (
            <div className="space-y-2">
              <Label
                htmlFor={field.name}
                className="text-xs tracking-widest text-white/50 uppercase"
              >
                Email
              </Label>
              <Input
                id={field.name}
                name={field.name}
                type="email"
                placeholder="you@company.com"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-sm text-destructive">
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <div className="space-y-2">
              <Label
                htmlFor={field.name}
                className="text-xs tracking-widest text-white/50 uppercase"
              >
                Password
              </Label>
              <Input
                id={field.name}
                name={field.name}
                type="password"
                placeholder="••••••••"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-sm text-destructive">
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Subscribe>
          {(state) => (
            <Button
              type="submit"
              className="mt-2 w-full border-transparent bg-white text-gray-950 hover:bg-gray-200"
              disabled={!state.canSubmit || state.isSubmitting}
            >
              {state.isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </AuthShell>
  );
}
