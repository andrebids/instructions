import React from "react";

const UserContext = React.createContext({
  userName: "Christopher",
  setUserName: () => {},
});

export function UserProvider({ children }) {
  const [userName, setUserName] = React.useState(() => {
    try {
      const saved = localStorage.getItem("userName");
      return saved ? saved : "Christopher";
    } catch (_) {
      return "Christopher";
    }
  });

  React.useEffect(() => {
    try { localStorage.setItem("userName", userName); } catch (_) {}
  }, [userName]);

  const value = React.useMemo(() => ({ userName, setUserName }), [userName]);

  return (
    <UserContext.Provider value={value}>{children}</UserContext.Provider>
  );
}

export function useUser() {
  return React.useContext(UserContext);
}


