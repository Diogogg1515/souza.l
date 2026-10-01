import { redirect } from "next/navigation";
import { getCurrentUser, type UserRole } from "@/lib/auth/get-user";
import { logout } from "./actions";

const ROLE_LABELS: Record<UserRole, string> = {
  client: "Cliente",
  worker: "Trabalhador",
  admin: "Administrador",
};

export default async function PainelPage() {
  const user = await getCurrentUser();

  // Segunda verificação, além do proxy: nunca dependa de uma barreira só.
  if (!user) {
    redirect("/login");
  }

  const { profile } = user;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Painel</h1>

      {profile ? (
        <div className="flex flex-col gap-1">
          <p>
            Olá, <strong>{profile.name}</strong>.
          </p>
          <p>Tipo de conta: {ROLE_LABELS[profile.role]}</p>
          {profile.role === "client" && profile.clientCode && (
            <p>
              Seu código de cliente:{" "}
              <strong className="font-mono tracking-wider">
                {profile.clientCode}
              </strong>
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-red-600">
          Sua conta ainda não tem um perfil. Saia e entre novamente, ou fale
          com o administrador.
        </p>
      )}

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