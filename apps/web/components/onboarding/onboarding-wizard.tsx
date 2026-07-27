"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

type Step = 1 | 2 | 3 | 4;

export function OnboardingWizard({
  organizationName,
  hasCustomer,
  hasServiceOrder,
}: {
  organizationName: string;
  hasCustomer: boolean;
  hasServiceOrder: boolean;
}) {
  const router = useRouter();
  const initialStep = useMemo<Step>(() => {
    if (!hasCustomer) return 3;
    if (!hasServiceOrder) return 4;
    return 1;
  }, [hasCustomer, hasServiceOrder]);

  const [step, setStep] = useState<Step>(hasCustomer || hasServiceOrder ? initialStep : 1);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const invite = await apiFetch<{
        acceptUrl: string;
        emailSent?: boolean;
      }>("/api/v1/invites", {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail, role: "MECHANIC" }),
      });
      setInviteLink(
        invite.emailSent
          ? `E-mail enviado para ${inviteEmail}`
          : invite.acceptUrl,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao convidar");
    } finally {
      setLoading(false);
    }
  }

  async function createCustomer(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/api/v1/customers", {
        method: "POST",
        body: JSON.stringify({ name: customerName, phone: customerPhone || undefined }),
      });
      setStep(4);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar cliente");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-6 py-12">
      <div>
        <p className="eyebrow text-signal">Primeiros passos</p>
        <h1 className="display-lg mt-3 text-4xl text-ink">{organizationName}</h1>
        <p className="mt-2 mono-label text-ink-mute">Passo {step} de 4</p>
      </div>

      {error && <p className="text-sm text-alert">{error}</p>}

      {step === 1 && (
        <section className="space-y-4 border border-line bg-bg-panel p-5">
          <h2 className="font-semibold tracking-tight text-ink">1. Oficina pronta</h2>
          <p className="text-sm leading-relaxed text-ink-dim">
            Sua oficina <strong className="text-ink">{organizationName}</strong> já está criada.
            Vamos configurar o time e o primeiro atendimento.
          </p>
          <Button type="button" onClick={() => setStep(2)}>
            Continuar
          </Button>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4 border border-line bg-bg-panel p-5">
          <h2 className="font-semibold tracking-tight text-ink">2. Convidar um mecânico</h2>
          <p className="text-sm text-ink-dim">Opcional — você pode pular e fazer depois.</p>
          <form onSubmit={sendInvite} className="space-y-3">
            <div>
              <label htmlFor="invite-email">E-mail do mecânico</label>
              <input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={loading || !inviteEmail}>
                {loading ? "Enviando..." : "Criar convite"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setStep(3)}>
                Pular
              </Button>
            </div>
          </form>
          {inviteLink && (
            <p className="break-all text-xs text-ok">
              Link: <a href={inviteLink}>{inviteLink}</a>
            </p>
          )}
          {inviteLink && (
            <Button type="button" onClick={() => setStep(3)}>
              Próximo
            </Button>
          )}
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4 border border-line bg-bg-panel p-5">
          <h2 className="font-semibold tracking-tight text-ink">3. Primeiro cliente</h2>
          {hasCustomer ? (
            <>
              <p className="text-sm text-ink-dim">Você já tem cliente cadastrado.</p>
              <Button type="button" onClick={() => setStep(4)}>
                Continuar
              </Button>
            </>
          ) : (
            <form onSubmit={createCustomer} className="space-y-3">
              <div>
                <label htmlFor="cust-name">Nome do cliente</label>
                <input
                  id="cust-name"
                  required
                  minLength={2}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="cust-phone">Telefone (opcional)</label>
                <input
                  id="cust-phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Salvando..." : "Salvar cliente"}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setStep(4)}>
                  Pular
                </Button>
              </div>
            </form>
          )}
        </section>
      )}

      {step === 4 && (
        <section className="space-y-4 border border-line bg-bg-panel p-5">
          <h2 className="font-semibold tracking-tight text-ink">4. Primeira ordem de serviço</h2>
          <p className="text-sm leading-relaxed text-ink-dim">
            Abra uma OS para o veículo do cliente — aí o ciclo da oficina começa de verdade.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => router.push("/workshop/service-orders/new")}>
              Criar OS
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push("/workshop")}>
              Ir ao dashboard
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
