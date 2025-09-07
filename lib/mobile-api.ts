// HTTP client for external API calls (works for both mobile and desktop)

// Both mobile and desktop call Bambu API directly since there are no Next.js API routes
export async function cloudAuth(body: { account: string; password?: string; code?: string }) {
  try {
    const res = await fetch('https://api.bambulab.com/v1/user-service/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Failed to fetch' };
  }
}

export async function cloudUser(token: string) {
  try {
    const res = await fetch('https://api.bambulab.com/v1/user-service/user/profile', {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Failed to fetch' };
  }
}