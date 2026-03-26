import { supabase } from "./supabase";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").trim();

export async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options?.headers,
  };

  if (token) {
    (headers as any)["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${path}`;
  console.log(`[API REQUEST] Fetching: ${url}`); // Enhanced logging

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Could not read error body");
      console.error(`API Error [${response.status}]: ${errorText}`);
      let errorDetail = "Unknown error";
      try {
        const errorJson = JSON.parse(errorText);
        errorDetail = errorJson.detail || errorDetail;
      } catch (e) {}
      throw new Error(errorDetail);
    }

    return response.json();
  } catch (error: any) {
    console.error(`Fetch failed for ${url}:`, error);
    throw error;
  }
}
