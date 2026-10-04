import { parseLocalDateTime } from "@/lib/agenda/time";

export type VisitInput = {
  clientName: string;
  phone: string | null;
  address: string;
  scheduledAt: string;
  notes: string | null;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function parseVisitForm(
  formData: FormData,
): { value: VisitInput } | { error: string } {
  const clientName = String(formData.get("client_name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const phoneDigits = String(formData.get("phone") ?? "").replace(/\D/g, "");
  const when = parseLocalDateTime(String(formData.get("scheduled_at") ?? ""));

  if (clientName.length < 2 || clientName.length > 100) {
    return { error: "Informe o nome do cliente (entre 2 e 100 caracteres)." };
  }
  if (!when) {
    return { error: "Informe a data e a hora da visita." };
  }
  if (address.length < 3 || address.length > 300) {
    return { error: "Informe o local da visita." };
  }
  if (phoneDigits && (phoneDigits.length < 8 || phoneDigits.length > 15)) {
    return {
      error: "O telefone parece incompleto. Informe com DDD ou deixe em branco.",
    };
  }
  if (notes.length > 500) {
    return { error: "A observação pode ter até 500 caracteres." };
  }

  return {
    value: {
      clientName,
      phone: phoneDigits || null,
      address,
      scheduledAt: when.toISOString(),
      notes: notes || null,
    },
  };
}
