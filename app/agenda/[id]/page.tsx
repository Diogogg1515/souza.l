import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { getVisit } from "@/lib/agenda/visits";
import { dayKey, formatDayLabel, formatTime } from "@/lib/agenda/time";
import { whatsappNumber } from "@/lib/agenda/phone";
import { VisitStatusDot } from "@/components/agenda/visit-status-dot";
import { answerVisit, deleteVisit } from "../actions";
import { RescheduleForm } from "./reschedule-form";

type Props = { params: Promise<{ id: string }> };

export default async function VisitaPage({ params }: Props) {
  await requireRole(["worker"]);

  const { id } = await params;
  const visit = await getVisit(id);

  if (!visit) {
    notFound();
  }

  const timePassed = new Date(visit.scheduledAt).getTime() <= Date.now();
  const canAnswer = visit.status === "scheduled" && timePassed;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-5 py-10">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-600">
          {formatDayLabel(dayKey(visit.scheduledAt))} às{" "}
          {formatTime(visit.scheduledAt)}
        </p>
        <h1 className="text-2xl font-semibold">{visit.clientName}</h1>
        <p className="text-base">{visit.address}</p>
        <VisitStatusDot status={visit.status} />
        {visit.notes && (
          <p className="rounded-lg bg-gray-100 p-3 text-sm">{visit.notes}</p>
        )}
      </div>

      {visit.phone && (
        <div className="flex gap-3">
          <a
            href={`tel:+${whatsappNumber(visit.phone)}`}
            className="flex h-12 flex-1 items-center justify-center rounded-lg border border-gray-300 text-base font-medium"
          >
            Ligar
          </a>
          <a
            href={`https://wa.me/${whatsappNumber(visit.phone)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 flex-1 items-center justify-center rounded-lg border border-gray-300 text-base font-medium"
          >
            WhatsApp
          </a>
        </div>
      )}

      {canAnswer && (
        <section className="flex flex-col gap-3 rounded-2xl border-2 border-gray-900 p-4">
          <p className="text-lg font-semibold">
            Você realizou esse orçamento?
          </p>
          <form action={answerVisit} className="flex gap-3">
            <input type="hidden" name="id" value={visit.id} />
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
        </section>
      )}

      {visit.serviceId ? (
        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-900">
          Esta visita virou serviço.
        </p>
      ) : (
        visit.status === "done" && (
          <Link
            href={`/pedidos/novo?visita=${visit.id}`}
            className="flex h-12 items-center justify-center rounded-lg bg-gray-900 text-base font-medium text-white"
          >
            Virou serviço? Enviar convite
          </Link>
        )
      )}

      <a
        href={`/agenda/${visit.id}/calendario`}
        className="flex h-12 items-center justify-center rounded-lg border border-gray-300 text-base font-medium"
      >
        Adicionar ao calendário do celular
      </a>

      {visit.status !== "done" && <RescheduleForm id={visit.id} />}

      <details className="rounded-xl border border-gray-200 p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Excluir visita
        </summary>
        <form action={deleteVisit} className="mt-3 flex flex-col gap-2">
          <p className="text-sm text-gray-600">
            Esta ação não pode ser desfeita.
          </p>
          <input type="hidden" name="id" value={visit.id} />
          <button
            type="submit"
            className="h-12 rounded-lg border border-red-700 text-base font-medium text-red-700"
          >
            Confirmar exclusão
          </button>
        </form>
      </details>

      <Link href="/agenda" className="text-center text-sm underline">
        Voltar à agenda
      </Link>
    </main>
  );
}
