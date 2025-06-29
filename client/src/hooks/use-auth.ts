import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check if user is already logged in (e.g., from localStorage)
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout");
      return response.json();
    },
    onSuccess: () => {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("user");
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    },
    onError: () => {
      // Force logout even if API call fails
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("user");
    },
  });

  const login = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    isLoggingOut: logoutMutation.isPending,
  };
}