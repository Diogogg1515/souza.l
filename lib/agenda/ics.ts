import type { Visit } from "@/lib/agenda/types";

// Escapa os caracteres especiais do formato de calendário (.ics)
function escapeText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

// 2026-10-03T18:00:00.000Z -> 20261003T180000Z
function toUtcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// Gera um arquivo de calendário com alarme 30 minutos antes.
// O alarme é do próprio celular: funciona com o aplicativo fechado.
export function buildIcs(visit: Visit): string {
  const start = new Date(visit.scheduledAt);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const details = [
    visit.phone ? `Telefone: ${visit.phone}` : null,
    visit.notes ? `Observação: ${visit.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//souza.l//Agenda//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${visit.id}@souza.l`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    `DTSTART:${toUtcStamp(start)}`,
    `DTEND:${toUtcStamp(end)}`,
    `SUMMARY:${escapeText(`Orçamento: ${visit.clientName}`)}`,
    `LOCATION:${escapeText(visit.address)}`,
    ...(details ? [`DESCRIPTION:${escapeText(details)}`] : []),
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Orçamento em 30 minutos",
    "TRIGGER:-PT30M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n") + "\r\n";
}
