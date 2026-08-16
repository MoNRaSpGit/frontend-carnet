import { useState, type FormEvent } from "react";

type LoginScreenProps = {
  onLoginUsuario: () => void;
  onLoginAdmin: (pin: string) => Promise<void>;
};

const ADMIN_UNLOCK_CLICKS = 5;

export function LoginScreen({ onLoginUsuario, onLoginAdmin }: LoginScreenProps) {
  const [titleClicks, setTitleClicks] = useState(0);
  const [showPinForm, setShowPinForm] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const showAdminButton = titleClicks >= ADMIN_UNLOCK_CLICKS;

  async function handleSubmitPin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await onLoginAdmin(pin);
    } catch {
      setError("PIN incorrecto.");
      setPin("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="carnet-login-shell">
      <section className="carnet-login-card">
        <h1 className="carnet-login-title" onClick={() => setTitleClicks((current) => current + 1)}>
          Peñarol
        </h1>

        <button type="button" className="carnet-login-button" onClick={onLoginUsuario}>
          Iniciar
        </button>

        {showAdminButton && !showPinForm ? (
          <button
            type="button"
            className="carnet-login-button carnet-login-button--admin"
            onClick={() => setShowPinForm(true)}
          >
            Admin
          </button>
        ) : null}

        {showPinForm ? (
          <form className="carnet-login-pin-form" onSubmit={handleSubmitPin}>
            <input
              type="password"
              className="carnet-login-pin-input"
              placeholder="PIN de administrador"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              autoFocus
            />
            <button
              type="submit"
              className="carnet-login-button carnet-login-button--admin"
              disabled={submitting || !pin}
            >
              {submitting ? "Validando..." : "Ingresar"}
            </button>
            {error ? <p className="carnet-login-pin-error">{error}</p> : null}
          </form>
        ) : null}
      </section>
    </main>
  );
}
