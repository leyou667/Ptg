import { AdminShell } from "@/components/admin/AdminShell";
import { PrestationsEditor } from "@/components/admin/PrestationsEditor";
import { requireAdmin } from "@/lib/admin/auth";
import { loadBillingDeps, loadCatalog, loadVat } from "@/lib/billing/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Prestations et tarifs" };

export default async function Page() {
  const { csrf } = await requireAdmin();
  const [deps, c, v] = await Promise.all([loadBillingDeps(), loadCatalog(), loadVat()]);
  return (
    <AdminShell active="/admin/prestations" csrf={csrf}>
      <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>Prestations et tarifs</h1>
      <p className="lead mt-4">Vos prix ne sont pas encore définis : saisissez-les ici quand ils le seront. Rien n&apos;est prérempli.</p>
      <div className="mt-10">
        <PrestationsEditor csrf={csrf} vat={deps.vatRates} vatRev={v?.rev} catalog={deps.catalog} catalogRev={c?.rev} />
      </div>
    </AdminShell>
  );
}
