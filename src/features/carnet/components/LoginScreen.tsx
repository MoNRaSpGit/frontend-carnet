import { useState } from "react";

type LoginScreenProps = {
  onLoginUsuario: () => void;
  onLoginAdmin: () => void;
};

const ADMIN_UNLOCK_CLICKS = 5;

export function LoginScreen({ onLoginUsuario, onLoginAdmin }: LoginScreenProps) {
  const [titleClicks, setTitleClicks] = useState(0);
  const showAdminButton = titleClicks >= ADMIN_UNLOCK_CLICKS;

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
          <button type="button" className="carnet-login-button carnet-login-button--admin" onClick={onLoginAdmin}>
            Admin
          </button>
        ) : null}
      </section>
    </main>
  );
}
