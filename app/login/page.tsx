import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  // Quem já está logado não precisa ver a tela de login.
  if (data?.claims) {
    redirect("/painel");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Entrar</h1>
      <LoginForm />
      <div className="flex flex-col gap-2 text-sm">
        <p>
          <Link href="/recuperar-senha" className="underline">
            Esqueci minha senha
          </Link>
        </p>
        <p>
          Não tem conta?{" "}
          <Link href="/cadastro" className="underline">
            Criar conta
          </Link>
        </p>
      </div>
    </main>
  );
}