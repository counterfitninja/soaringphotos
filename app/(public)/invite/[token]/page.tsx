import Image from "next/image";
import RegisterForm from "@/components/RegisterForm";
import { db } from "@/lib/db";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await db.invite.findUnique({ where: { token } });
  const valid = !!invite && !invite.usedAt && invite.expiresAt > new Date();

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow">
        <Image
          src="/logo.jpeg"
          alt="Famstagram"
          width={220}
          height={235}
          className="mx-auto mb-4 h-auto w-44"
          priority
        />
        <h1 className="mb-1 text-2xl font-bold">Join Famstagram</h1>
        {valid ? (
          <>
            <p className="mb-6 text-sm text-neutral-500">Create your family account</p>
            <RegisterForm token={token} />
          </>
        ) : (
          <p className="mt-4 text-sm text-red-600">
            This invite link is invalid, already used, or expired. Ask a family admin for a
            new one.
          </p>
        )}
      </div>
    </main>
  );
}
