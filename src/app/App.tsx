import { AdminApp } from "./AdminApp";
import { UsuarioApp } from "./UsuarioApp";
import { recordCarnetVisit } from "../features/carnet/carnet.api";
import { LoginScreen } from "../features/carnet/components/LoginScreen";
import { useCarnetAuth } from "../features/carnet/hooks/useCarnetAuth";
import { getVisitorId } from "../shared/utils/visitorId";

function trackVisit(role: "usuario" | "admin") {
  // Fire-and-forget: no debe frenar ni romper el ingreso si la llamada falla.
  void recordCarnetVisit(getVisitorId(), role).catch(() => {});
}

export function App() {
  const { role, loginUsuario, loginAdmin, logout } = useCarnetAuth();

  if (role === "admin") {
    return <AdminApp onLogout={logout} />;
  }

  if (role === "usuario") {
    return <UsuarioApp onLogout={logout} />;
  }

  return (
    <LoginScreen
      onLoginUsuario={() => {
        loginUsuario();
        trackVisit("usuario");
      }}
      onLoginAdmin={async (pin) => {
        await loginAdmin(pin);
        trackVisit("admin");
      }}
    />
  );
}
