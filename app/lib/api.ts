// utils/api.ts
export const getAuthToken = (): string | null => {
    // Retrieve the token from localStorage, sessionStorage, or other storage
    return localStorage.getItem('token'); // or sessionStorage.getItem('authToken')
};

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    const headers = new Headers(options.headers || {});

    if (token) {
        headers.append('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    return response;
};
