import type { VisitStatus } from "@/lib/agenda/types";

const STATUS: Record<VisitStatus, { dot: string; label: string }> = {
  scheduled: { dot: "bg-gray-400", label: "Agendado" },
  done: { dot: "bg-green-600", label: "Realizado" },
  not_done: { dot: "bg-red-600", label: "Não realizado" },
};

// A cor nunca vem sozinha: o texto sempre acompanha o ponto.
export function VisitStatusDot({ status }: { status: VisitStatus }) {
  const { dot, label } = STATUS[status];

  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span aria-hidden="true" className={`h-3 w-3 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
