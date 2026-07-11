"use client";

import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";

interface UseSearchUsersReturn {
  results: SearchUser[];
  loading: boolean;
  error: string | null;
  query: string;
  setQuery: (query: string) => void;
  refetch: () => void;
}

export interface SearchUser {
  id: string;
  name: string;
  username: string;
  profilePicture: string | null;
  bio: string | null;
  statusMessage: string | null;
  isOnline: boolean;
  lastSeen: string | null;
  createdAt: string;
  isFriend: boolean;
  hasPendingRequest: boolean;
  requestDirection: "sent" | "received" | null;
}

export function useSearchUsers(): UseSearchUsersReturn {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 300);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      setResults(data.data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    if (query.trim()) {
      search(query);
    }
  }, [query, search]);

  useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  return { results, loading, error, query, setQuery, refetch };
}
