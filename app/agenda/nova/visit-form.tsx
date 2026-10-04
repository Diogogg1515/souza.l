"use client";

import { useActionState } from "react";
import { createVisit, type VisitFormState } from "../actions";

const initialState: VisitFormState = { error: null };

const inputClass =
  "h-12 rounded-lg border border-gray-300 px-3 text-base text-gray-900";

export function VisitForm() {
  const [state, formAction, pending] = useActionState(
    createVisit,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="client_name" className="text-sm font-medium">
          Nome do cliente
        </label>
        <input
          id="client_name"
          name="client_name"
          type="text"
          required
          maxLength={100}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="scheduled_at" className="text-sm font-medium">
          Data e hora
        </label>
        <input
          id="scheduled_at"
          name="scheduled_at"
          type="datetime-local"
          required
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="address" className="text-sm font-medium">
          Local
        </label>
        <input
          id="address"
          name="address"
          type="text"
          required
          maxLength={300}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-sm font-medium">
          Telefone (opcional)
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="off"
          placeholder="DDD + número"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm font-medium">
          Observação (opcional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={500}
          className="rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900"
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-lg bg-gray-900 text-base font-medium text-white disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Salvar visita"}
      </button>
    </form>
  );
}
