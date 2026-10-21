export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-ligne border-y border-ligne">
      {items.map((i) => (
        <details key={i.q} className="group">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
            {i.q}
            <span aria-hidden className="relative h-5 w-5 shrink-0">
              <span className="absolute left-0 top-1/2 h-0.5 w-5 -translate-y-1/2 bg-marine" />
              <span className="absolute left-1/2 top-0 h-5 w-0.5 -translate-x-1/2 bg-marine transition-transform duration-200 group-open:scale-y-0" />
            </span>
          </summary>
          <p className="pb-6 text-marine-soft">{i.a}</p>
        </details>
      ))}
    </div>
  );
}
