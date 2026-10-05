"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/agenda/form";
import { getVisit } from "@/lib/agenda/visits";
import { whatsappNumber } from "@/lib/agenda/phone";

export type InviteFormState = {
  error: string | null;
  link: string | null;
  whatsappUrl: string | null;
};

const MESSAGES: Record<string, string> = {
  invalid_service_type: "Informe o tipo de serviço (entre 2 e 100 caracteres).",
  invalid_client_name: "Informe o nome do cliente (entre 2 e 100 caracteres).",
  visit_not_found: "Visita não encontrada.",
  visit_already_converted: "Esta visita já virou serviço.",
  not_allowed: "Só o profissional pode criar convites.",
};

function friendlyMessage(raw: string): string {
  const key = Object.keys(MESSAGES).find((code) => raw.includes(code));
  return key
    ? MESSAGES[key]
    : "Não foi possível criar o convite. Tente novamente.";
}

export async function createInvite(
  _prevState: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  const serviceType = String(formData.get("service_type") ?? "").trim();
  const clientLabel = String(formData.get("client_label") ?? "").trim();
  const visitRaw = String(formData.get("visit_id") ?? "");
  const visitId = isUuid(visitRaw) ? visitRaw : null;

  const empty = { link: null, whatsappUrl: null };

  if (serviceType.length < 2 || serviceType.length > 100) {
    return { error: MESSAGES.invalid_service_type, ...empty };
  }
  if (clientLabel.length < 2 || clientLabel.length > 100) {
    return { error: MESSAGES.invalid_client_name, ...empty };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    throw new Error("Variável NEXT_PUBLIC_SITE_URL é obrigatória.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_service_invite", {
    p_service_type: serviceType,
    p_client_label: clientLabel,
    p_visit_id: visitId,
  });

  if (error) {
    console.error("Erro ao criar convite:", error.message);
    return { error: friendlyMessage(error.message), ...empty };
  }

  // O código só existe aqui: o banco guarda apenas a impressão digital dele.
  const link = `${siteUrl}/convite/${String(data)}`;

  const visit = visitId ? await getVisit(visitId) : null;
  const text = `Olá, ${clientLabel}! Segue o link para aceitar o pedido de serviço (${serviceType}) no souza.l: ${link}`;
  const base = visit?.phone
    ? `https://wa.me/${whatsappNumber(visit.phone)}`
    : "https://wa.me/";
  const whatsappUrl = `${base}?text=${encodeURIComponent(text)}`;

  revalidatePath("/convites");
  revalidatePath("/agenda");

  return { error: null, link, whatsappUrl };
}
