// Mobile HTTP client for external API calls
import { Capacitor } from '@capacitor/core';

const isMobile = Capacitor.isNativePlatform();

// For mobile, we need to directly call external APIs instead of using Next.js API routes
export async function cloudAuth(body: { account: string; password?: string; code?: string }) {
  if (!isMobile) {
    // Desktop/web version uses Next.js API route
    const res = await fetch('/api/cloud/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await res.json();
  }

  // Mobile version calls Bambu API directly
  try {
    const res = await fetch('https://api.bambulab.com/v1/user-service/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return data;
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function cloudUser(token: string) {
  if (!isMobile) {
    // Desktop/web version uses Next.js API route
    const res = await fetch('/api/cloud/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    return await res.json();
  }

  // Mobile version calls Bambu API directly
  try {
    const res = await fetch('https://api.bambulab.com/v1/user-service/user/profile', {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      }
    });

    const data = await res.json();
    return data;
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}