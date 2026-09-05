import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow">
        <h1 className="mb-1 text-2xl font-bold">🦅 Soaring Photos</h1>
        <p className="mb-6 text-sm text-neutral-500">Sign in to your family account</p>
        <LoginForm />
        <p className="mt-6 text-center text-xs text-neutral-400">
          This is a private site. Ask a family admin for an invite link to join.
        </p>
      </div>
    </main>
  );
}
