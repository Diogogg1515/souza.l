"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SignupState = { error: string | null; info: string | null };

export async function signup(
  _prevState: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (name.length < 2 || name.length > 100) {
    return { error: "Informe seu nome (entre 2 e 100 caracteres).", info: null };
  }
  if (!email) {
    return { error: "Informe seu e-mail.", info: null };
  }
  if (password.length < 8) {
    return { error: "A senha deve ter pelo menos 8 caracteres.", info: null };
  }
  if (password !== confirm) {
    return { error: "As senhas não conferem.", info: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) {
    // Mensagem genérica de propósito: não revela se o e-mail já existe.
    return {
      error: "Não foi possível criar a conta. Confira os dados e tente novamente.",
      info: null,
    };
  }

  // Sem sessão = o Supabase está exigindo confirmação por e-mail.
  if (!data.session) {
    return {
      error: null,
      info: "Conta criada! Confirme seu e-mail para poder entrar.",
    };
  }

  redirect("/painel");
}