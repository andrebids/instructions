import React from "react";
import { useAuthContext } from "./AuthContext";

const UserContext = React.createContext({
  userName: "Christopher",
  setUserName: () => { },
});

export function UserProvider({ children }) {
  // Hook deve ser chamado sempre, não condicionalmente
  // useAuthContext já trata hot reload internamente retornando valor padrão
  const authContext = useAuthContext();
  const authUser = authContext?.user;

  // Get user name from AuthContext
  const userName = React.useMemo(() => {
    // Prioridade: AuthContext > localStorage
    if (authUser?.name) {
      console.log('🔍 [UserContext] Usando nome do authUser:', authUser.name);
      return authUser.name;
    }
    if (authUser?.email) {
      console.log('🔍 [UserContext] Usando email do authUser:', authUser.email);
      return authUser.email;
    }

    try {
      const saved = localStorage.getItem("userName");
      console.log('🔍 [UserContext] Usando nome do localStorage:', saved);
      return saved ? saved : "Christopher";
    } catch (_) {
      return "Christopher";
    }
  }, [authUser?.name, authUser?.email, authUser?.id]); // Adicionar id para garantir atualização

  const setUserName = React.useCallback((name) => {
    try { localStorage.setItem("userName", name); } catch (_) { }
  }, []);

  // Create user object with name and avatar
  const user = React.useMemo(() => ({
    name: userName,
    avatar: authUser?.image || null,
    email: authUser?.email || null,
    role: authUser?.role || null
  }), [userName, authUser?.image, authUser?.email, authUser?.role]);

  const value = React.useMemo(() => ({
    userName,
    setUserName,
    user  // Add user object for components that need it
  }), [userName, setUserName, user]);

  return (
    <UserContext.Provider value={value}>{children}</UserContext.Provider>
  );
}

// Hook compatível com Fast Refresh
// Deve ser uma função nomeada exportada diretamente
function useUser() {
  return React.useContext(UserContext);
}

// Exportar como named export para compatibilidade com Fast Refresh
export { useUser };


