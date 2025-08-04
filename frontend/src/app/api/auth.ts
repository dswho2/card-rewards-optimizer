// src/api/auth.ts

export async function loginOrSignup({
  username,
  password,
  isLogin,
}: {
  username: string;
  password: string;
  isLogin: boolean;
}): Promise<{ success: boolean; message?: string; token?: string }> {
  const endpoint = isLogin ? '/api/login' : '/api/signup';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    return {
      success: res.ok && data.success,
      message: data.message,
      token: data.token,
    };
  } catch (err) {
    return { success: false, message: 'Server error' };
  }
}
