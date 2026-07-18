import { AdminApp } from "./AdminApp";
import { UsuarioApp } from "./UsuarioApp";
import { LoginScreen } from "../features/carnet/components/LoginScreen";
import { useCarnetAuth } from "../features/carnet/hooks/useCarnetAuth";

export function App() {
  const { role, login, logout } = useCarnetAuth();

  if (role === "admin") {
    return <AdminApp onLogout={logout} />;
  }

  if (role === "usuario") {
    return <UsuarioApp onLogout={logout} />;
  }

  return <LoginScreen onLoginUsuario={() => login("usuario")} onLoginAdmin={() => login("admin")} />;
}
