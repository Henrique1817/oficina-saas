"use client";

import { useState, type FormEvent } from "react";
import { contactSchema } from "@/lib/contact-schema";

type FieldErrors = Partial<Record<"name" | "email" | "workshop" | "message", string>>;

export function ContactForm() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [serverMessage, setServerMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrors({});
    setServerMessage("");

    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      workshop: String(form.get("workshop") ?? ""),
      message: String(form.get("message") ?? ""),
    };

    const parsed = contactSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (
          key === "name" ||
          key === "email" ||
          key === "workshop" ||
          key === "message"
        ) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      setStatus("idle");
      return;
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };

      if (!res.ok) {
        setStatus("error");
        setServerMessage(data.message ?? "Não foi possível enviar. Tente de novo.");
        return;
      }

      setStatus("ok");
      setServerMessage(data.message ?? "Recebemos. Em breve retornamos.");
      e.currentTarget.reset();
    } catch {
      setStatus("error");
      setServerMessage("Falha de rede. Tente novamente.");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border border-line bg-bg-panel p-6 md:p-8"
      noValidate
    >
      <Field
        label="Seu nome"
        name="name"
        error={errors.name}
        autoComplete="name"
      />
      <Field
        label="E-mail"
        name="email"
        type="email"
        error={errors.email}
        autoComplete="email"
      />
      <Field
        label="Nome da oficina"
        name="workshop"
        error={errors.workshop}
        autoComplete="organization"
      />
      <Field
        label="Mensagem"
        name="message"
        as="textarea"
        error={errors.message}
      />

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-2 inline-flex w-full items-center justify-center bg-signal px-6 py-3.5 text-sm font-semibold text-bg transition hover:bg-signal-bright disabled:opacity-60"
        data-cursor="hot"
      >
        {status === "loading" ? "Enviando…" : "Enviar mensagem"}
      </button>

      {serverMessage ? (
        <p
          className={[
            "mt-4 text-sm",
            status === "ok" ? "text-ok" : "text-alert",
          ].join(" ")}
          role="status"
        >
          {serverMessage}
        </p>
      ) : null}
    </form>
  );
}

function Field({
  label,
  name,
  error,
  type = "text",
  as,
  autoComplete,
}: {
  label: string;
  name: string;
  error?: string;
  type?: string;
  as?: "textarea";
  autoComplete?: string;
}) {
  const id = `contact-${name}`;
  const shared =
    "mt-2 w-full border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-mute focus:border-signal";

  return (
    <div className="mb-5">
      <label htmlFor={id} className="mono-label text-ink-mute">
        {label}
      </label>
      {as === "textarea" ? (
        <textarea
          id={id}
          name={name}
          rows={5}
          className={shared + " resize-y min-h-[120px]"}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-err` : undefined}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          className={shared}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-err` : undefined}
        />
      )}
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 text-xs text-alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
