import { requireAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

/** Barrière de plus : un layout ne se rejoue pas à chaque navigation, donc chaque page revérifie aussi la session. */
export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return children;
}
