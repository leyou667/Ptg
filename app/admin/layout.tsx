import type { Metadata } from "next";

/** L'administration n'est jamais indexée ni mise en cache. */
export const metadata: Metadata = {
  title: { default: "Administration", template: "%s | Administration CheyClean" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div data-admin>{children}</div>;
}
