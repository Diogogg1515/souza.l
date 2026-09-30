import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PainelPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  // Segunda verificação, além do proxy: nunca dependa de uma barreira só.
  if (!data?.claims) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-2 p-6">
      <h1 className="text-2xl font-semibold">Painel</h1>
      <p>Você está logado como {String(data.claims.email ?? "")}.</p>
    </main>
  );
}