import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { VisitForm } from "./visit-form";

export default async function NovaVisitaPage() {
  await requireRole(["worker"]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-5 py-10">
      <h1 className="text-2xl font-semibold">Nova visita</h1>
      <VisitForm />
      <Link href="/agenda" className="text-center text-sm underline">
        Voltar à agenda
      </Link>
    </main>
  );
}
