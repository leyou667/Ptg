import Image from "next/image";

export function Logo({ dark = false, className = "h-10 w-auto" }: { dark?: boolean; className?: string }) {
  return (
    <Image
      src={dark ? "/images/logo-dark.png" : "/images/logo.png"}
      alt="CheyClean"
      width={753}
      height={427}
      className={className}
      priority
    />
  );
}
