import { createInvite, deleteInvite } from "@/app/actions/invites";
import CopyInviteLink from "@/components/CopyInviteLink";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { btnSmall } from "@/lib/ui";

export default async function AdminInvitesPage() {
  await requireAdmin();
  const invites = await db.invite.findMany({
    include: { usedBy: { select: { username: true } } },
    orderBy: { createdAt: "desc" },
  });
  const now = new Date();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Invite links</h1>
        <form action={createInvite}>
          <button className={btnSmall}>+ Generate invite link</button>
        </form>
      </div>
      <p className="text-xs text-neutral-500">
        Invite links are single-use and expire 7 days after creation. Send them privately to
        family members.
      </p>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {invites.length === 0 ? (
          <p className="p-6 text-center text-sm text-neutral-500">
            No invites yet. Generate one to invite your first family member.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {invites.map((invite) => {
              const expired = invite.expiresAt < now;
              const active = !invite.usedAt && !expired;
              return (
                <li key={invite.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    {active ? (
                      <CopyInviteLink token={invite.token} />
                    ) : (
                      <code className="text-xs text-neutral-400">/invite/{invite.token}</code>
                    )}
                    <p className="mt-1 text-xs text-neutral-500">
                      {invite.usedAt ? (
                        <>
                          ✅ Used by{" "}
                          <span className="font-medium">
                            {invite.usedBy?.username ?? "unknown"}
                          </span>
                        </>
                      ) : expired ? (
                        "⌛ Expired"
                      ) : (
                        <>🟢 Active · expires {invite.expiresAt.toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                  {!invite.usedAt && (
                    <form action={deleteInvite.bind(null, invite.id)}>
                      <button
                        className="text-xs text-neutral-400 hover:text-red-600"
                        title="Delete invite"
                      >
                        Delete
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
