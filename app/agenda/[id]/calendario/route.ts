import { getVisit } from "@/lib/agenda/visits";
import { buildIcs } from "@/lib/agenda/ics";

// Baixa um arquivo de calendário (.ics) da visita, com alarme 30 min antes.
// Só o profissional dono consegue: sem login o proxy bloqueia, e o banco
// (RLS) só devolve visitas do próprio usuário.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const visit = await getVisit(id);

  if (!visit) {
    return new Response("Visita não encontrada.", { status: 404 });
  }

  return new Response(buildIcs(visit), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="orcamento.ics"',
      "Cache-Control": "no-store",
    },
  });
}
