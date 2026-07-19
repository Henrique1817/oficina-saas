"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import type { WhatsappTemplate } from "@oficina/shared";
import { DEFAULT_WHATSAPP_TEMPLATES } from "@/lib/quote-messaging";

type OrgBranding = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  quoteValidityDays: number;
  whatsappTemplates: WhatsappTemplate[];
};

function newTemplateId() {
  return `tpl_${Math.random().toString(36).slice(2, 9)}`;
}

export function WorkshopSettingsForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [quoteValidityDays, setQuoteValidityDays] = useState("7");
  const [templates, setTemplates] = useState<WhatsappTemplate[]>(DEFAULT_WHATSAPP_TEMPLATES);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const org = await apiFetch<OrgBranding>("/api/v1/organization");
        if (cancelled) return;
        setName(org.name);
        setPhone(org.phone ?? "");
        setEmail(org.email ?? "");
        setAddress(org.address ?? "");
        setQuoteValidityDays(String(org.quoteValidityDays ?? 7));
        setTemplates(
          org.whatsappTemplates?.length
            ? org.whatsappTemplates
            : DEFAULT_WHATSAPP_TEMPLATES,
        );
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Falha ao carregar");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateTemplate(index: number, patch: Partial<WhatsappTemplate>) {
    setTemplates((prev) =>
      prev.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    );
  }

  function addTemplate() {
    setTemplates((prev) => [
      ...prev,
      {
        id: newTemplateId(),
        label: "Novo modelo",
        body: "Olá {{customer}}! Orçamento #{{orderNumber}} — total {{total}}. {{workshop}}",
      },
    ]);
  }

  function removeTemplate(index: number) {
    setTemplates((prev) => prev.filter((_, i) => i !== index));
  }

  function resetDefaults() {
    setTemplates(DEFAULT_WHATSAPP_TEMPLATES);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      await apiFetch("/api/v1/organization", {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
          quoteValidityDays: Number(quoteValidityDays) || 7,
          whatsappTemplates: templates.filter((t) => t.label.trim() && t.body.trim()),
        }),
      });
      setOk("Configurações salvas.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-ink-mute">Carregando...</p>;
  }

  return (
    <form onSubmit={save} className="max-w-2xl space-y-8">
      {error && <p className="text-sm text-alert">{error}</p>}
      {ok && <p className="text-sm text-ok">{ok}</p>}

      <section className="space-y-4 border border-line bg-bg-panel p-6">
        <p className="mono-label text-signal">Identidade no orçamento</p>
        <div>
          <label htmlFor="ws-name">Nome da oficina</label>
          <input
            id="ws-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="ws-phone">Telefone / WhatsApp</label>
            <input
              id="ws-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="11999999999"
            />
          </div>
          <div>
            <label htmlFor="ws-email">E-mail</label>
            <input
              id="ws-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label htmlFor="ws-address">Endereço</label>
          <textarea
            id="ws-address"
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
        <div className="max-w-xs">
          <label htmlFor="ws-validity">Validade do orçamento (dias)</label>
          <input
            id="ws-validity"
            type="number"
            min={1}
            max={90}
            value={quoteValidityDays}
            onChange={(e) => setQuoteValidityDays(e.target.value)}
          />
        </div>
      </section>

      <section className="space-y-4 border border-line bg-bg-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="mono-label text-ok">Mensagens WhatsApp</p>
            <p className="mt-1 text-xs text-ink-mute">
              Placeholders: {"{{customer}} {{orderNumber}} {{plate}} {{vehicle}} {{total}} {{workshop}} {{validityDays}} {{dueAt}}"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={resetDefaults}>
              Restaurar padrão
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={addTemplate}>
              + Modelo
            </Button>
          </div>
        </div>

        {templates.map((t, i) => (
          <div key={t.id} className="space-y-3 border border-line p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[180px] flex-1">
                <label htmlFor={`tpl-label-${t.id}`}>Nome do modelo</label>
                <input
                  id={`tpl-label-${t.id}`}
                  value={t.label}
                  onChange={(e) => updateTemplate(i, { label: e.target.value })}
                />
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => removeTemplate(i)}
                disabled={templates.length <= 1}
              >
                Remover
              </Button>
            </div>
            <div>
              <label htmlFor={`tpl-body-${t.id}`}>Texto</label>
              <textarea
                id={`tpl-body-${t.id}`}
                rows={5}
                value={t.body}
                onChange={(e) => updateTemplate(i, { body: e.target.value })}
              />
            </div>
          </div>
        ))}
      </section>

      <Button type="submit" disabled={saving}>
        {saving ? "Salvando..." : "Salvar configurações"}
      </Button>
    </form>
  );
}
