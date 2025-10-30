import React from "react";
import { useUser as useClerkUser } from "@clerk/clerk-react";

const UserContext = React.createContext({
  userName: "Christopher",
  setUserName: () => {},
});

export function UserProvider({ children }) {
  const { user: clerkUser } = useClerkUser();
  
  // Get user name from Clerk or fallback to localStorage/default
  const userName = React.useMemo(() => {
    if (clerkUser?.fullName) return clerkUser.fullName;
    if (clerkUser?.firstName) return clerkUser.firstName;
    
    try {
      const saved = localStorage.getItem("userName");
      return saved ? saved : "Christopher";
    } catch (_) {
      return "Christopher";
    }
  }, [clerkUser?.fullName, clerkUser?.firstName]);

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


