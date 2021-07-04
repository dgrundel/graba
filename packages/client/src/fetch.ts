
export const getJson = <T>(url: string): Promise<T> => {
    return fetch(url).then(response => response.json());
}

export const postJson = <T>(url: string, data: any): Promise<T> => {
    const options: RequestInit = {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
    };

    return fetch(url, options).then(response => response.json());
}