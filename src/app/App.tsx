import { AdminApp } from "./AdminApp";
import { UsuarioApp } from "./UsuarioApp";
import { recordCarnetVisit } from "../features/carnet/carnet.api";
import { LoginScreen } from "../features/carnet/components/LoginScreen";
import { useCarnetAuth } from "../features/carnet/hooks/useCarnetAuth";
import { getVisitorId } from "../shared/utils/visitorId";

function handleLogin(login: (role: "usuario" | "admin") => void, role: "usuario" | "admin") {
  login(role);
  // Fire-and-forget: no debe frenar ni romper el ingreso si la llamada falla.
  void recordCarnetVisit(getVisitorId(), role).catch(() => {});
}

export function App() {
  const { role, login, logout } = useCarnetAuth();

  if (role === "admin") {
    return <AdminApp onLogout={logout} />;
  }

  if (role === "usuario") {
    return <UsuarioApp onLogout={logout} />;
  }

  return (
    <LoginScreen
      onLoginUsuario={() => handleLogin(login, "usuario")}
      onLoginAdmin={() => handleLogin(login, "admin")}
    />
  );
}
