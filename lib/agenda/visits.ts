import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/agenda/form";
import type { Visit, VisitStatus } from "@/lib/agenda/types";

// Quanto tempo depois do horário marcado o painel pergunta
// "Você realizou esse orçamento?". Valor único, fácil de mudar.
export const PROMPT_DELAY_MINUTES = 60;

type Row = {
  id: string;
  client_name: string;
  phone: string | null;
  address: string;
  scheduled_at: string;
  notes: string | null;
  status: VisitStatus;
  service_id: string | null;
};

const COLUMNS =
  "id, client_name, phone, address, scheduled_at, notes, status, service_id";

function toVisit(row: Row): Visit {
  return {
    id: row.id,
    clientName: row.client_name,
    phone: row.phone,
    address: row.address,
    scheduledAt: row.scheduled_at,
    notes: row.notes,
    status: row.status,
    serviceId: row.service_id,
  };
}

// Só o profissional dono enxerga as visitas: quem garante isso é o banco (RLS).
export async function listVisits(): Promise<Visit[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quote_visits")
    .select(COLUMNS)
    .order("scheduled_at", { ascending: false })
    .limit(300);

  if (error) {
    console.error("Erro ao listar visitas:", error.code);
    return [];
  }
  return (data as Row[]).map(toVisit).reverse();
}

export async function getVisit(id: string): Promise<Visit | null> {
  if (!isUuid(id)) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quote_visits")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar visita:", error.code);
    return null;
  }
  return data ? toVisit(data as Row) : null;
}

// Visitas agendadas cujo horário já passou há tempo suficiente para perguntar.
export function pendingQuestions(
  visits: Visit[],
  now: number = Date.now(),
): Visit[] {
  const delay = PROMPT_DELAY_MINUTES * 60 * 1000;
  return visits.filter(
    (visit) =>
      visit.status === "scheduled" &&
      new Date(visit.scheduledAt).getTime() + delay <= now,
  );
}
