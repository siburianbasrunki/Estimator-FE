import { createContext, useContext, useState, type ReactNode } from "react";

interface AuthContextType {
  token: string | null;
  user: User | null;
  email: string;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setEmail: (email: string) => void;
  logout: () => void;
}

interface User {
  id: string;
  name: string;
  email: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [user, setUser] = useState<User | null>(() => {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  });
  const [email, setEmail] = useState("");

  const handleSetToken = (newToken: string | null) => {
    console.log("Storing token:", newToken); 
    if (newToken) {
      localStorage.setItem("token", newToken);
    } else {
      localStorage.removeItem("token");
    }
    setToken(newToken);
  };
  const handleSetUser = (newUser: User | null) => {
    if (newUser) {
      localStorage.setItem("user", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("user");
    }
    setUser(newUser);
  };

  const logout = () => {
    handleSetToken(null);
    handleSetUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        email,
        setToken: handleSetToken,
        setUser: handleSetUser,
        setEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
