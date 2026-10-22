import { AdminShell } from "@/components/admin/AdminShell";
import { CompanyForm } from "@/components/admin/CompanyForm";
import { requireAdmin } from "@/lib/admin/auth";
import { loadBillingDeps, loadCompany } from "@/lib/billing/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Entreprise" };

export default async function Page() {
  const { csrf } = await requireAdmin();
  const [deps, company] = await Promise.all([loadBillingDeps(), loadCompany()]);
  return (
    <AdminShell active="/admin/entreprise" csrf={csrf}>
      <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>Entreprise</h1>
      <p className="lead mt-4">Ces informations figurent sur chaque devis. Elles sont obligatoires pour en émettre un.</p>
      <div className="mt-10 max-w-4xl">
        <CompanyForm csrf={csrf} rev={company?.rev} seller={deps.seller} quoteTerms={deps.quoteTerms} defaultValidDays={deps.defaultValidDays} />
      </div>
    </AdminShell>
  );
}
