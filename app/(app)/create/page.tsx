import UploadForm from "@/components/UploadForm";
import { requireUser } from "@/lib/auth";

export default async function CreatePage() {
  await requireUser();
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="mb-1 text-lg font-semibold">New post</h1>
      <p className="mb-4 text-sm text-neutral-500">
        Share up to 10 images or one short video (max 60 seconds) with the family.
      </p>
      <UploadForm />
    </div>
  );
}
