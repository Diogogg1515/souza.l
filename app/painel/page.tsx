import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./actions";

export default async function PainelPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  // Segunda verificação, além do proxy: nunca dependa de uma barreira só.
  if (!data?.claims) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Painel</h1>
      <p>Você está logado como {String(data.claims.email ?? "")}.</p>

      <form action={logout}>
        <button
          type="submit"
          className="h-12 w-full rounded-lg border border-gray-300 text-base font-medium"
        >
          Sair
        </button>
      </form>
    </main>
  );
}