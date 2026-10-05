import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { getVisit } from "@/lib/agenda/visits";
import { isUuid } from "@/lib/agenda/form";
import { InviteForm } from "./invite-form";

type Props = { searchParams: Promise<{ visita?: string }> };

export default async function NovoPedidoPage({ searchParams }: Props) {
  await requireRole(["worker"]);

  const { visita } = await searchParams;
  const visit = visita && isUuid(visita) ? await getVisit(visita) : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-5 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Novo pedido</h1>
        <p className="text-gray-600">
          Crie um convite e envie o link pelo WhatsApp. O cliente aceita
          criando a conta na hora.
        </p>
      </div>

      {visit?.serviceId ? (
        <p className="rounded-lg bg-gray-100 p-3 text-sm">
          Esta visita já virou serviço.
        </p>
      ) : (
        <InviteForm
          visitId={visit?.id ?? null}
          defaultName={visit?.clientName ?? ""}
        />
      )}

      <Link href="/painel" className="text-center text-sm underline">
        Voltar ao painel
      </Link>
    </main>
  );
}
