export function Star({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title} fill="currentColor">
      <path d="M12 0c.9 6.6 4.5 10.9 12 12-7.5 1.1-11.1 5.4-12 12-.9-6.6-4.5-10.9-12-12C7.5 10.9 11.1 6.6 12 0Z" />
    </svg>
  );
}
