export async function registerAdmin(token: string, data: { name: string; surname: string; email: string }) {
    const response = await fetch('/api/users/admin', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ data })
    });
    
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to register admin");
    }

    return response;
}

export async function getAllAdmins(token: string) {
    const response = await fetch('/api/users/admin', {
        method: 'GET',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
    const admins = await response.json();
    return admins;
}

export async function resetPassword( data: { email: string; tempPassword: string; newPassword: string }) {
    const response = await fetch('/api/users/admin', {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data })
    });
    
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to reset password");
    }

    return response;
}

export async function deleteAdmin(token: string, id: number) {
    const response = await fetch('/api/users/admin', {
        method: 'DELETE',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify( id )
    });
    
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to register admin");
    }

    return response;
}