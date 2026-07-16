import React, { createContext, useState, useContext, ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  userEmail: string | null;
  organizationId: string | null;
  organizationName: string | null;
  role: string | null;
  isAuthenticated: boolean;
  login: (token: string, email: string, orgId: string, orgName: string, role: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [userEmail, setUserEmail] = useState<string | null>(localStorage.getItem('user_email'));
  const [organizationId, setOrganizationId] = useState<string | null>(localStorage.getItem('organization_id'));
  const [organizationName, setOrganizationName] = useState<string | null>(localStorage.getItem('organization_name'));
  const [role, setRole] = useState<string | null>(localStorage.getItem('role'));

  const login = (
    jwtToken: string,
    email: string,
    orgId: string,
    orgName: string,
    userRole: string
  ) => {
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user_email', email);
    localStorage.setItem('organization_id', orgId);
    localStorage.setItem('organization_name', orgName);
    localStorage.setItem('role', userRole);

    setToken(jwtToken);
    setUserEmail(email);
    setOrganizationId(orgId);
    setOrganizationName(orgName);
    setRole(userRole);
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setUserEmail(null);
    setOrganizationId(null);
    setOrganizationName(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        userEmail,
        organizationId,
        organizationName,
        role,
        isAuthenticated: !!token,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider scope');
  }
  return context;
};
