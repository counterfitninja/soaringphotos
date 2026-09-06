"use client";

import { useActionState } from "react";
import { updateProfilePhoto, type ProfilePhotoState } from "@/app/actions/profile";

const initialState: ProfilePhotoState = null;

export default function ProfilePhotoForm() {
  const [state, formAction, pending] = useActionState(updateProfilePhoto, initialState);

  return (
    <form action={formAction} className="mt-3">
      <label className="cursor-pointer text-xs font-medium text-sky-700 hover:text-sky-800">
        {pending ? "Uploading..." : "Change photo"}
        <input
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          disabled={pending}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
        />
      </label>
      {state?.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
    </form>
  );
}