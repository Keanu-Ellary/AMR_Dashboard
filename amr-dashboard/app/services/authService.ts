export async function login(email: string, password: string) {

    const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    return response;
};

export async function getMe() {
    const response = await fetch('/api/me', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 60 }
    });

    const meData = await response.json();
    return meData.user;
}

export async function logout() {
    const response = await fetch('api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })

    return response;
}
export async function resetPassword(email: string, password: string) {
    const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to reset password");
    }

    return response;
}
