
export const getJson = <T>(url: string): Promise<T> => {
    return fetch(url).then(response => response.json());
}

export const postJson = async <T>(url: string, data: any): Promise<T> => {
    const options: RequestInit = {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
    };

    const response = await fetch(url, options);
    if (response.status === 200) {
        return response.json();
    }

    const text = await response.text();
    throw new Error(text);
}