import Image from "next/image";

export const lieux = {
  fenetre: { src: "/images/lieux/fenetre.webp", alt: "Grande baie vitrée donnant sur des palmiers, lumière du matin dans une villa" },
  arche: { src: "/images/lieux/arche.webp", alt: "Hall voûté avec fenêtre cintrée et sol en marbre brillant" },
  sol: { src: "/images/lieux/sol.webp", alt: "Sol en marbre poli qui reflète la lumière d'une grande fenêtre" },
  escalier: { src: "/images/lieux/escalier.webp", alt: "Escalier en courbe et rampe en fer forgé dans un hall lumineux" },
  salon: { src: "/images/lieux/salon.webp", alt: "Salon spacieux avec canapés clairs et hautes fenêtres" },
} as const;

type Props = {
  name: keyof typeof lieux;
  /** Rapport largeur/hauteur du cadre. Les images sont toutes rognées de la même façon, coins carrés. */
  ratio?: string;
  position?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

export function Photo({ name, ratio = "4 / 5", position = "50% 50%", className = "", priority, sizes = "(min-width: 768px) 40vw, 100vw" }: Props) {
  const p = lieux[name];
  return (
    <div className={`relative overflow-hidden bg-card ${className}`} style={{ aspectRatio: ratio }}>
      <Image src={p.src} alt={p.alt} fill sizes={sizes} priority={priority} loading={priority ? undefined : "lazy"} className="object-cover" style={{ objectPosition: position }} />
    </div>
  );
}
