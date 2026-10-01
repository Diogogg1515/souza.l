"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(
  _prevState: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Preencha o e-mail e a senha." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Aparece só no terminal do servidor, nunca para o usuário.
    console.error("Erro de login:", error.code, error.message);
    // Mensagem genérica de propósito: não revela se o e-mail existe.
    return { error: "E-mail ou senha incorretos." };
  }

  redirect("/painel");
}