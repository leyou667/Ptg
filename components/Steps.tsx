import { Reveal } from "./Reveal";
import { Photo } from "./Photo";

type Step = { t: string; d: string };

/** Lignes qui descendent en escalier : la séquence s'écrit, elle ne se numérote pas. */
export function Steps({ steps }: { steps: Step[] }) {
  const starts = ["lg:col-start-1 lg:col-span-12", "lg:col-start-3 lg:col-span-10", "lg:col-start-5 lg:col-span-8", "lg:col-start-7 lg:col-span-6"];
  return (
    <section id="contenu" data-chapter="dark" className="field-ink on-dark section scroll-mt-16">
      <div className="container-x">
        <div className="grid12 gap-y-12 md:gap-y-14">
          {steps.map((s, i) => (
            <Reveal key={s.t} delay={i * 80} className={`col-span-12 ${starts[i]}`}>
              {i === 0 ? (
                <h2 className="max-w-[18ch]">{s.t}</h2>
              ) : (
                <p className={`font-semibold tracking-tight ${i === 3 ? "text-cyan" : ""}`} style={{ fontSize: "clamp(2rem, 1rem + 3.6vw, 4.5rem)", lineHeight: 1, letterSpacing: "-0.038em" }}>
                  {s.t}
                </p>
              )}
              <p className="mt-4 max-w-[34ch] text-[1.125rem] text-white/85">{s.d}</p>
            </Reveal>
          ))}
          <Reveal delay={200} className="col-span-12 row-start-3 hidden lg:col-span-4 lg:col-start-1 lg:row-span-2 lg:row-start-3 lg:block lg:self-end">
            <Photo name="escalier" ratio="4 / 5" position="50% 40%" sizes="30vw" />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
