import React from "react";
import { useAuthContext } from "./AuthContext";

const UserContext = React.createContext({
  userName: "Christopher",
  setUserName: () => {},
});

export function UserProvider({ children }) {
  // Usar sempre AuthContext (que gerencia Auth.js)
  // Usar try-catch para lidar com hot reload
  let authContext;
  try {
    authContext = useAuthContext();
  } catch (error) {
    // Durante hot reload, pode haver erros temporários
    if (import.meta.env.DEV) {
      console.warn('⚠️ [UserContext] Erro ao obter AuthContext durante hot reload:', error.message);
      authContext = null;
    } else {
      throw error;
    }
  }
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
    try { localStorage.setItem("userName", name); } catch (_) {}
  }, []);

  const value = React.useMemo(() => ({ userName, setUserName }), [userName, setUserName]);

  return (
    <UserContext.Provider value={value}>{children}</UserContext.Provider>
  );
}

export function useUser() {
  return React.useContext(UserContext);
}


