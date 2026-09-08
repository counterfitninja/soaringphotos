/**
 * Small chip identifying which feed a post or notification belongs to.
 * Always visible in merged views so the audience is identifiable at a glance (FR-008).
 */
export default function FeedLabel({ name }: { name: string }) {
  return (
    <span className="inline-flex max-w-32 items-center truncate rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700 ring-1 ring-inset ring-sky-200">
      {name}
    </span>
  );
}
