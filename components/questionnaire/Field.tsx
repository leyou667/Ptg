"use client";

import type { FieldDef, Values } from "./config";
import { labels } from "@/content/questionnaire";

type Props = {
  def: FieldDef;
  value: string | boolean;
  error?: string;
  onChange: (name: string, value: string | boolean) => void;
  onBlur: (name: string) => void;
  idPrefix: string;
  values: Values;
};

export function Field({ def, value, error, onChange, onBlur, idPrefix }: Props) {
  const id = `${idPrefix}-${def.name}`;
  const describedBy = [error ? `${id}-err` : "", def.help ? `${id}-help` : ""].filter(Boolean).join(" ") || undefined;
  const common = {
    id,
    name: def.name,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    onBlur: () => onBlur(def.name),
  } as const;

  if (def.type === "checkbox") {
    return (
      <div className="md:col-span-2">
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input
            {...common}
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(def.name, e.target.checked)}
            className="h-6 w-6 shrink-0 accent-primary"
          />
          <span>{def.label}</span>
        </label>
      </div>
    );
  }

  return (
    <div className={def.span === 2 ? "md:col-span-2" : undefined}>
      <label htmlFor={id} className="mb-2 block font-semibold">
        {def.label}
      </label>
      {def.type === "select" ? (
        <select {...common} className="champ" value={String(value)} onChange={(e) => onChange(def.name, e.target.value)}>
          <option value="">{labels.select}</option>
          {def.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : def.type === "textarea" ? (
        <textarea {...common} className="champ min-h-36" maxLength={def.maxLength} value={String(value)} onChange={(e) => onChange(def.name, e.target.value)} />
      ) : (
        <input
          {...common}
          className="champ"
          type={def.type === "number" ? "text" : def.type}
          inputMode={def.inputMode}
          autoComplete={def.autoComplete}
          maxLength={def.maxLength}
          value={String(value)}
          onChange={(e) => onChange(def.name, def.type === "number" ? e.target.value.replace(/[^\d]/g, "") : e.target.value)}
        />
      )}
      {def.help && (
        <p id={`${id}-help`} className="small soft mt-1.5">
          {def.help}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} role="alert" className="erreur">
          {error}
        </p>
      )}
    </div>
  );
}
