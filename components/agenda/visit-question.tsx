import { answerVisit } from "@/app/agenda/actions";
import { dayKey, formatDayLabel, formatTime } from "@/lib/agenda/time";
import type { Visit } from "@/lib/agenda/types";

// Cartão "Você realizou esse orçamento?" (aparece no painel do profissional).
// Mostra uma visita por vez; as outras esperam a sua vez.
export function VisitQuestion({ visits }: { visits: Visit[] }) {
  if (visits.length === 0) {
    return null;
  }

  const [current, ...rest] = visits;

  return (
    <section
      aria-live="polite"
      className="flex flex-col gap-3 rounded-2xl border-2 border-gray-900 p-4"
    >
      <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        Pergunta rápida
      </p>
      <p className="text-lg font-semibold">
        Você realizou o orçamento de {current.clientName} (
        {formatTime(current.scheduledAt)})?
      </p>
      <p className="text-sm text-gray-600">
        {formatDayLabel(dayKey(current.scheduledAt))} · {current.address}
      </p>

      <form action={answerVisit} className="flex gap-3">
        <input type="hidden" name="id" value={current.id} />
        <button
          type="submit"
          name="answer"
          value="done"
          className="h-12 flex-1 rounded-lg bg-green-700 text-base font-medium text-white"
        >
          Sim
        </button>
        <button
          type="submit"
          name="answer"
          value="not_done"
          className="h-12 flex-1 rounded-lg bg-red-700 text-base font-medium text-white"
        >
          Não
        </button>
      </form>

      {rest.length > 0 && (
        <p className="text-sm text-gray-600">
          Mais {rest.length} aguardando resposta.
        </p>
      )}
    </section>
  );
}
