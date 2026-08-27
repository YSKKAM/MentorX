const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname || "localhost";
    return `http://${hostname}:3001/api`;
  }
  return "http://localhost:3001/api";
};

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new ApiError(503, "Failed to connect to the server. Please try again later.", { originalError: error });
  }

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      // Optional: trigger a global event or redirect to login here if needed
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.error || data?.message || response.statusText || "An error occurred",
      data
    );
  }

  return data;
}

export const api = {
  get: (endpoint: string, options?: RequestInit) => 
    fetchWithAuth(endpoint, { ...options, method: "GET" }),
    
  post: (endpoint: string, body: any, options?: RequestInit) => 
    fetchWithAuth(endpoint, { ...options, method: "POST", body: JSON.stringify(body) }),
    
  put: (endpoint: string, body: any, options?: RequestInit) => 
    fetchWithAuth(endpoint, { ...options, method: "PUT", body: JSON.stringify(body) }),
    
  delete: (endpoint: string, options?: RequestInit) => 
    fetchWithAuth(endpoint, { ...options, method: "DELETE" }),
};
