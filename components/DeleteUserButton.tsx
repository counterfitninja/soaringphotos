"use client";

import { deleteUserAsAdmin } from "@/app/actions/admin";

type DeleteUserButtonProps = {
  userId: string;
  username: string;
};

export default function DeleteUserButton({ userId, username }: DeleteUserButtonProps) {
  const deleteUser = deleteUserAsAdmin.bind(null, userId);

  return (
    <form
      action={deleteUser}
      onSubmit={(event) => {
        if (!window.confirm(`Delete ${username}'s account and all of their posts? This cannot be undone.`)) {
          event.preventDefault();
        }
      }}
    >
      <button className="text-xs font-medium text-red-600 hover:text-red-800">Delete</button>
    </form>
  );
}
