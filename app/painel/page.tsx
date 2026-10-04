import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, type UserRole } from "@/lib/auth/get-user";
import { listVisits, pendingQuestions } from "@/lib/agenda/visits";
import { dayKey, formatTime } from "@/lib/agenda/time";
import { VisitQuestion } from "@/components/agenda/visit-question";
import { VisitStatusDot } from "@/components/agenda/visit-status-dot";
import { logout } from "./actions";

const ROLE_LABELS: Record<UserRole, string> = {
  client: "Cliente",
  worker: "Trabalhador",
  admin: "Administrador",
};

export default async function PainelPage() {
  const user = await getCurrentUser();

  // Segunda verificação, além do proxy: nunca dependa de uma barreira só.
  if (!user) {
    redirect("/login");
  }

  const { profile } = user;
  const isWorker = profile?.role === "worker";

  // A agenda é só do profissional (o banco também garante isso).
  const visits = isWorker ? await listVisits() : [];
  const pending = pendingQuestions(visits);
  const today = dayKey(Date.now());
  const todayVisits = visits.filter((visit) => dayKey(visit.scheduledAt) === today);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-5 py-10">
      <h1 className="text-2xl font-semibold">Painel</h1>

      {profile ? (
        <div className="flex flex-col gap-1">
          <p>
            Olá, <strong>{profile.name}</strong>.
          </p>
          <p>Tipo de conta: {ROLE_LABELS[profile.role]}</p>
          {profile.role === "client" && profile.clientCode && (
            <p>
              Seu código de cliente:{" "}
              <strong className="font-mono tracking-wider">
                {profile.clientCode}
              </strong>
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-red-600">
          Sua conta ainda não tem um perfil. Saia e entre novamente, ou fale
          com o administrador.
        </p>
      )}

      {isWorker && (
        <>
          <VisitQuestion visits={pending} />

          <section aria-labelledby="hoje" className="flex flex-col gap-3">
            <h2
              id="hoje"
              className="text-sm font-semibold uppercase tracking-wide text-gray-500"
            >
              Hoje
            </h2>

            {todayVisits.length === 0 ? (
              <p className="text-gray-600">Nenhuma visita marcada para hoje.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {todayVisits.map((visit) => (
                  <li key={visit.id}>
                    <Link
                      href={`/agenda/${visit.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-3"
                    >
                      <span>
                        <strong>{formatTime(visit.scheduledAt)}</strong> ·{" "}
                        {visit.clientName}
                      </span>
                      <VisitStatusDot status={visit.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <Link
              href="/agenda"
              className="flex h-12 items-center justify-center rounded-lg bg-gray-900 text-base font-medium text-white"
            >
              Agenda de orçamentos
            </Link>
          </section>
        </>
      )}

      {/* Atalhos por papel (a proteção real está dentro de cada página). */}
      {(profile?.role === "worker" || profile?.role === "admin") && (
        <Link href="/clientes" className="underline">
          Clientes
        </Link>
      )}
      {profile?.role === "admin" && (
        <Link href="/admin" className="underline">
          Administração
        </Link>
      )}

      <form action={logout}>
        <button
          type="submit"
          className="h-12 w-full rounded-lg border border-gray-300 text-base font-medium"
        >
          Sair
        </button>
      </form>
    </main>
  );
}
