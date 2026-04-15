import { LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";

import { Field } from "../components/Field";
import { PrimaryButton } from "../components/PrimaryButton";
import { Panel } from "../components/Panel";
import { useAuth } from "../contexts/auth-context";

export function LoginPage() {
  const { authenticating, login, bootstrap, needsBootstrap } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      if (needsBootstrap) {
        await bootstrap(form);
      } else {
        await login({
          email: form.email,
          password: form.password
        });
      }
    } catch {
      setError(
        needsBootstrap
          ? "Não foi possível concluir o primeiro acesso."
          : "Email ou senha inválidos."
      );
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-10 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.14),_transparent_28%)]" />
      <div className="relative w-full max-w-md">
        <Panel
          title={needsBootstrap ? "Primeiro acesso" : "Entrar"}
          subtitle={
            needsBootstrap
              ? "Crie sua conta para proteger os dados atuais e continuar usando o app com segurança."
              : "Acesse seu ambiente financeiro pessoal."
          }
          icon={ShieldCheck}
          iconColor="#7dd3fc"
          tone="info"
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            {needsBootstrap ? (
              <Field
                label="Nome"
                placeholder="Seu nome"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                rightSlot={<UserRound className="h-4 w-4 text-slate-500" />}
                required
              />
            ) : null}

            <Field
              label="Email"
              type="email"
              placeholder="voce@email.com"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              rightSlot={<Mail className="h-4 w-4 text-slate-500" />}
              required
            />

            <Field
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              rightSlot={<LockKeyhole className="h-4 w-4 text-slate-500" />}
              required
            />

            {error ? <p className="text-sm text-sky-200">{error}</p> : null}

            <PrimaryButton type="submit" disabled={authenticating}>
              {authenticating
                ? "Aguarde..."
                : needsBootstrap
                  ? "Criar acesso"
                  : "Entrar"}
            </PrimaryButton>
          </form>
        </Panel>
      </div>
    </div>
  );
}
