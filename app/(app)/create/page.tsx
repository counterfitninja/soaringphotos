import UploadForm from "@/components/UploadForm";
import { requireFeedContext } from "@/lib/feed-context";

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const ctx = await requireFeedContext();
  const { error } = await searchParams;
  const feeds = ctx.memberships.map((m) => ({ feedId: m.feedId, feedName: m.feedName }));
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="mb-1 text-lg font-semibold">New post</h1>
      <p className="mb-4 text-sm text-neutral-500">
        Share up to 10 images or one short video (max 60 seconds) with the family.
      </p>
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
      {feeds.length === 0 ? (
        <p className="text-sm text-neutral-500">
          You haven't been added to any feeds yet. Ask your family admin for an invite.
        </p>
      ) : (
        <UploadForm feeds={feeds} defaultFeedId={ctx.activeFeedId} />
      )}
    </div>
  );
}
