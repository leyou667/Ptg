import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { Logo } from "@/components/Logo";
import { adminConfigured, hasAdminSession } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await hasAdminSession()) redirect("/admin");
  return (
    <main className="container-x flex min-h-svh flex-col justify-center gap-10 py-16">
      <Logo className="h-14 w-auto self-start" />
      <div>
        <h1 style={{ fontSize: "clamp(2.2rem, 6vw, 4rem)" }}>Administration</h1>
        <p className="lead mt-4">Accès réservé. Connectez-vous pour consulter les demandes.</p>
      </div>
      <LoginForm configured={adminConfigured()} />
    </main>
  );
}
