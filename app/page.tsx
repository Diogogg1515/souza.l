import Link from "next/link";
import { getFeaturedProfile } from "@/lib/profiles/public-profile";
import { ProfileCard } from "@/components/profile-card";
import { WhatsAppButton } from "@/components/whatsapp-button";

export default async function HomePage() {
  const profile = await getFeaturedProfile();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-8 px-5 py-10">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-semibold tracking-wide text-gray-500">
          souza.l
        </p>
        <h1 className="text-3xl font-semibold leading-tight">
          Serviços combinados, registrados e documentados.
        </h1>
        <p className="text-base text-gray-600">
          Encontre um profissional, acompanhe cada etapa do serviço e tenha
          tudo guardado em um só lugar.
        </p>
      </header>

      {profile && (
        <section aria-labelledby="destaque" className="flex flex-col gap-4">
          <h2
            id="destaque"
            className="text-sm font-semibold uppercase tracking-wide text-gray-500"
          >
            Profissional em destaque
          </h2>
          <ProfileCard profile={profile} />
          <WhatsAppButton
            phone={profile.whatsapp}
            name={profile.displayName}
          />
          <Link
            href={`/p/${profile.slug}`}
            className="text-center text-sm underline"
          >
            Ver perfil completo
          </Link>
        </section>
      )}

      <footer className="mt-auto text-sm">
        <Link href="/login" className="underline">
          Já tenho conta: entrar
        </Link>
      </footer>
    </main>
  );
}
