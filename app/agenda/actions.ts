"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isUuid, parseVisitForm } from "@/lib/agenda/form";
import { parseLocalDateTime } from "@/lib/agenda/time";

export type VisitFormState = { error: string | null };

// A autorização de verdade é do banco (RLS): só o profissional dono
// consegue criar, alterar ou apagar visitas, mesmo que alguém tente
// chamar estas ações por fora da tela.

export async function createVisit(
  _prevState: VisitFormState,
  formData: FormData,
): Promise<VisitFormState> {
  const parsed = parseVisitForm(formData);
  if ("error" in parsed) {
    return { error: parsed.error };
  }
  const { value } = parsed;

  const supabase = await createClient();
  const { error } = await supabase.from("quote_visits").insert({
    client_name: value.clientName,
    phone: value.phone,
    address: value.address,
    scheduled_at: value.scheduledAt,
    notes: value.notes,
  });

  if (error) {
    console.error("Erro ao criar visita:", error.code);
    return { error: "Não foi possível salvar a visita. Tente novamente." };
  }

  revalidatePath("/agenda");
  revalidatePath("/painel");
  redirect("/agenda");
}

// Resposta da pergunta "Você realizou esse orçamento?" (Sim / Não)
export async function answerVisit(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const answer = String(formData.get("answer") ?? "");

  if (!isUuid(id) || (answer !== "done" && answer !== "not_done")) {
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("quote_visits")
    .update({ status: answer })
    .eq("id", id)
    .eq("status", "scheduled"); // só responde o que ainda está agendado

  if (error) {
    console.error("Erro ao responder visita:", error.code);
  }

  revalidatePath("/painel");
  revalidatePath("/agenda");
}

export async function rescheduleVisit(
  _prevState: VisitFormState,
  formData: FormData,
): Promise<VisitFormState> {
  const id = String(formData.get("id") ?? "");
  const when = parseLocalDateTime(String(formData.get("scheduled_at") ?? ""));

  if (!isUuid(id)) {
    return { error: "Visita inválida." };
  }
  if (!when) {
    return { error: "Informe a nova data e hora." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("quote_visits")
    .update({ scheduled_at: when.toISOString(), status: "scheduled" })
    .eq("id", id);

  if (error) {
    console.error("Erro ao reagendar visita:", error.code);
    return { error: "Não foi possível reagendar. Tente novamente." };
  }

  revalidatePath("/agenda");
  revalidatePath("/painel");
  redirect("/agenda");
}

export async function deleteVisit(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) {
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("quote_visits").delete().eq("id", id);

  if (error) {
    console.error("Erro ao apagar visita:", error.code);
  }

  revalidatePath("/agenda");
  revalidatePath("/painel");
  redirect("/agenda");
}
