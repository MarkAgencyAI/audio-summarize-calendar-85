
import { createContext, useState, useContext, ReactNode, useEffect } from "react";

export type UserRole = "student" | "teacher";

export interface User {
  id: string;
  name: string;
  email: string;
  career?: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, career: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // In a real app, we would make an API call here
      // For now, we'll simulate a successful login
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if email is registered (in localStorage for demo)
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const foundUser = users.find((u: any) => u.email === email);
      
      if (!foundUser) {
        throw new Error("Usuario no encontrado");
      }
      
      if (foundUser.password !== password) {
        throw new Error("Contraseña incorrecta");
      }
      
      // Remove password from user object
      const { password: _, ...userWithoutPassword } = foundUser;
      
      // Set user in state and localStorage
      setUser(userWithoutPassword);
      localStorage.setItem("user", JSON.stringify(userWithoutPassword));
      
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, career: string, role: UserRole) => {
    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get existing users from localStorage
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      
      // Check if email is already registered
      if (users.some((u: any) => u.email === email)) {
        throw new Error("El correo ya está registrado");
      }
      
      // Create new user
      const newUser = {
        id: crypto.randomUUID(),
        name,
        email,
        password, // In a real app, this would be hashed
        career,
        role
      };
      
      // Add user to localStorage
      users.push(newUser);
      localStorage.setItem("users", JSON.stringify(users));
      
      // Remove password from user object
      const { password: _, ...userWithoutPassword } = newUser;
      
      // Set user in state and localStorage
      setUser(userWithoutPassword);
      localStorage.setItem("user", JSON.stringify(userWithoutPassword));
      
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
