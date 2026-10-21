export function PageHero({ h1, intro, children }: { h1: string; intro?: string; children?: React.ReactNode }) {
  return (
    <section id="contenu" className="section pb-12 md:pb-16">
      <div className="container-x">
        <h1 className="max-w-[18ch]">{h1}</h1>
        {intro && <p className="mt-6 text-xl text-marine-soft">{intro}</p>}
        {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
      </div>
    </section>
  );
}
