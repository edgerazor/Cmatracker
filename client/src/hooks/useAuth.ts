import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });

  return {
    user: data?.user ?? null,
    userType: data?.type ?? null,
    isAgent: data?.type === "agent",
    isClient: data?.type === "client",
    isLoading,
    isAuthenticated: !!data?.user,
  };
}
