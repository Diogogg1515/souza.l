import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { listVisits } from "@/lib/agenda/visits";
import { dayKey, formatDayLabel, formatTime } from "@/lib/agenda/time";
import type { Visit } from "@/lib/agenda/types";
import { VisitStatusDot } from "@/components/agenda/visit-status-dot";

function groupByDay(visits: Visit[]): [string, Visit[]][] {
  const groups = new Map<string, Visit[]>();
  for (const visit of visits) {
    const key = dayKey(visit.scheduledAt);
    groups.set(key, [...(groups.get(key) ?? []), visit]);
  }
  return [...groups.entries()];
}

function DayGroup({ day, visits }: { day: string; visits: Visit[] }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        {formatDayLabel(day)}
      </h2>
      <ul className="flex flex-col gap-2">
        {visits.map((visit) => (
          <li key={visit.id}>
            <Link
              href={`/agenda/${visit.id}`}
              className="flex flex-col gap-1 rounded-xl border border-gray-200 p-4"
            >
              <span className="text-base">
                <strong>{formatTime(visit.scheduledAt)}</strong> ·{" "}
                {visit.clientName}
              </span>
              <span className="text-sm text-gray-600">{visit.address}</span>
              <VisitStatusDot status={visit.status} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function AgendaPage() {
  await requireRole(["worker"]);

  const visits = await listVisits();
  const today = dayKey(Date.now());

  const upcoming = groupByDay(
    visits.filter((visit) => dayKey(visit.scheduledAt) >= today),
  );
  const past = groupByDay(
    visits.filter((visit) => dayKey(visit.scheduledAt) < today),
  ).reverse();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-5 py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Agenda de orçamentos</h1>
      </div>

      <Link
        href="/agenda/nova"
        className="flex h-12 items-center justify-center rounded-lg bg-gray-900 text-base font-medium text-white"
      >
        Nova visita
      </Link>

      {visits.length === 0 && (
        <p className="text-gray-600">
          Nenhuma visita marcada. Toque em &quot;Nova visita&quot; para
          começar.
        </p>
      )}

      {upcoming.map(([day, items]) => (
        <DayGroup key={day} day={day} visits={items} />
      ))}

      {past.length > 0 && (
        <>
          <h2 className="mt-4 text-lg font-semibold">Anteriores</h2>
          {past.map(([day, items]) => (
            <DayGroup key={day} day={day} visits={items} />
          ))}
        </>
      )}

      <Link href="/painel" className="text-center text-sm underline">
        Voltar ao painel
      </Link>
    </main>
  );
}
