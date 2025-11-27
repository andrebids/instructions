import React, { createContext, useContext, useState } from 'react';

const LayoutContext = createContext(undefined);

export function LayoutProvider({ children }) {
  const [showCreateProjectForm, setShowCreateProjectForm] = useState(false);

  return (
    <LayoutContext.Provider value={{ showCreateProjectForm, setShowCreateProjectForm }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
