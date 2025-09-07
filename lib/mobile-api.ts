// HTTP client for external API calls (works for both mobile and desktop)

// Check if running in Capacitor environment
function isCapacitor(): boolean {
  return typeof window !== 'undefined' && !!(window as unknown as { Capacitor?: unknown })?.Capacitor;
}

// Enhanced fetch with better error handling for mobile
async function mobileCompatibleFetch(url: string, options: RequestInit): Promise<Response> {
  try {
    // If in Capacitor environment, we might need additional headers
    if (isCapacitor()) {
      options.headers = {
        ...options.headers,
        'User-Agent': 'PrintMate/1.0.0 (Mobile)',
        'Accept': 'application/json',
      };
    }

    const response = await fetch(url, options);
    return response;
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  }
}

// Both mobile and desktop call Bambu API directly since there are no Next.js API routes
export async function cloudAuth(body: { account: string; password?: string; code?: string }) {
  try {
    console.log('cloudAuth: Attempting to authenticate with Bambu Lab API', { account: body.account, isCapacitor: isCapacitor() });
    
    const res = await mobileCompatibleFetch('https://api.bambulab.com/v1/user-service/user/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'PrintMate/1.0.0'
      },
      body: JSON.stringify(body),
    });

    console.log('cloudAuth: Response status:', res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('cloudAuth: HTTP error response:', errorText);
      throw new Error(`HTTP error! status: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    console.log('cloudAuth: Success response received');
    return data;
  } catch (error: unknown) {
    console.error('cloudAuth: Request failed:', error);
    return { error: error instanceof Error ? error.message : 'Failed to fetch' };
  }
}

export async function cloudUser(token: string) {
  try {
    console.log('cloudUser: Attempting to fetch user profile', { isCapacitor: isCapacitor() });
    
    const res = await mobileCompatibleFetch('https://api.bambulab.com/v1/user-service/user/profile', {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'PrintMate/1.0.0'
      }
    });

    console.log('cloudUser: Response status:', res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('cloudUser: HTTP error response:', errorText);
      throw new Error(`HTTP error! status: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    console.log('cloudUser: Success response received');
    return data;
  } catch (error: unknown) {
    console.error('cloudUser: Request failed:', error);
    return { error: error instanceof Error ? error.message : 'Failed to fetch' };
  }
}