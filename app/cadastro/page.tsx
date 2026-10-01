import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignupForm } from "./signup-form";

export default async function CadastroPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    redirect("/painel");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Criar conta</h1>
      <SignupForm />
      <p className="text-sm">
        Já tem conta?{" "}
        <Link href="/login" className="underline">Entrar</Link>
      </p>
    </main>
  );
}