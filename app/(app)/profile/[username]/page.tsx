import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { initials } from "@/lib/utils";
import PasskeySetupButton from "@/components/PasskeySetupButton";
import ProfilePhotoForm from "@/components/ProfilePhotoForm";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const viewer = await requireUser();
  const { username } = await params;

  const profile = await db.user.findUnique({
    where: { username },
    include: {
      _count: { select: { posts: true } },
      posts: {
        orderBy: { createdAt: "desc" },
        include: {
          media: { orderBy: { order: "asc" }, take: 1 },
          _count: { select: { likes: true, comments: true } },
        },
      },
    },
  });
  if (!profile) notFound();

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-sm">
        {profile.avatarKey ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/media/${profile.avatarKey}`}
            alt={`${profile.username}'s profile photo`}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-xl font-bold text-sky-700">
            {initials(profile.username)}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-bold">{profile.username}</h1>
          <p className="text-sm text-neutral-500">
            {profile._count.posts} {profile._count.posts === 1 ? "post" : "posts"} · joined{" "}
            {profile.createdAt.toLocaleDateString()}
          </p>
          {viewer.id === profile.id && (
            <div className="mt-3 space-y-3">
              <ProfilePhotoForm />
              <PasskeySetupButton />
            </div>
          )}
        </div>
      </header>

      {profile.posts.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-neutral-500">No posts yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 overflow-hidden rounded-2xl">
          {profile.posts.map((post) => {
            const media = post.media[0];
            const isVideo = media?.mimeType.startsWith("video/");
            return (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="group relative aspect-square bg-neutral-200"
              >
                {media &&
                  (isVideo ? (
                    <video
                      src={`/api/media/${media.key}`}
                      muted
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/media/${media.key}`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ))}
                {isVideo && (
                  <span className="absolute right-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                    ▶
                  </span>
                )}
                <div className="absolute inset-0 hidden items-center justify-center gap-3 bg-black/40 text-sm font-medium text-white group-hover:flex">
                  <span>❤ {post._count.likes}</span>
                  <span>💬 {post._count.comments}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
