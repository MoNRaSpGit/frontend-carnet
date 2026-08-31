import { useState } from "react";

type LoginScreenProps = {
  onLoginUsuario: () => void;
  onLoginAdmin: (pin: string) => Promise<void>;
};

const ADMIN_UNLOCK_CLICKS = 5;

// TEMPORAL (pedido explicitamente para seguir probando comodo, igual que
// en frontend-joker): el boton "Admin" ya sigue escondido detras del click
// truco de 5 veces en el titulo, asi que se saco el paso de escribir el
// PIN y entra directo con el PIN fijo de abajo. Si en algun momento hay
// que volver a pedirlo, restaurar el form de PIN que estaba antes (ver
// git log de este archivo) y sacar ADMIN_FIXED_PIN.
const ADMIN_FIXED_PIN = "peñaroladmin5432!";

export function LoginScreen({ onLoginUsuario, onLoginAdmin }: LoginScreenProps) {
  const [titleClicks, setTitleClicks] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const showAdminButton = titleClicks >= ADMIN_UNLOCK_CLICKS;

  async function handleAdminClick() {
    setError(null);
    setSubmitting(true);

    try {
      await onLoginAdmin(ADMIN_FIXED_PIN);
    } catch {
      setError("No se pudo entrar como admin.");
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

        {showAdminButton ? (
          <button
            type="button"
            className="carnet-login-button carnet-login-button--admin"
            onClick={() => void handleAdminClick()}
            disabled={submitting}
          >
            {submitting ? "Entrando..." : "Admin"}
          </button>
        ) : null}

        {error ? <p className="carnet-login-pin-error">{error}</p> : null}
      </section>
    </main>
  );
}
