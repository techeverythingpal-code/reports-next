"use client";

import { ConfirmDelete } from "@/components/confirm-delete";
import { deleteDirectorate } from "./actions";

export function DeleteButton({ id }: { id: number }) {
  return <ConfirmDelete action={deleteDirectorate.bind(null, id)} />;
}
