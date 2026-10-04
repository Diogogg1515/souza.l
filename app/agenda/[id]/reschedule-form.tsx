"use client";

import { useActionState } from "react";
import { rescheduleVisit, type VisitFormState } from "../actions";

const initialState: VisitFormState = { error: null };

export function RescheduleForm({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(
    rescheduleVisit,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <label htmlFor="scheduled_at" className="text-sm font-medium">
        Nova data e hora
      </label>
      <input
        id="scheduled_at"
        name="scheduled_at"
        type="datetime-local"
        required
        className="h-12 rounded-lg border border-gray-300 px-3 text-base text-gray-900"
      />

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-lg border border-gray-900 text-base font-medium disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Reagendar"}
      </button>
    </form>
  );
}
