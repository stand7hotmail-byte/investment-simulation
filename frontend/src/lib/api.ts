import { supabase } from "./supabase";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").trim();

export async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options?.headers,
  };

  // Add Accept-Language header (I-010: Hydration Integrity)
  let locale: string | undefined;
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
    locale = match?.[1];
  } else {
    // Server-side: Try to get from next/headers if available
    try {
      // Dynamic import to avoid bundling next/headers on the client
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      locale = cookieStore.get('NEXT_LOCALE')?.value;
    } catch (e) {
      // Fail silently if next/headers is not available (e.g., in a non-request context)
    }
  }

  if (locale) {
    (headers as any)["Accept-Language"] = locale;
  }

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
