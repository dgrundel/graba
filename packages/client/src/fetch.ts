
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
    const responseData = await response.json();

    if (response.status === 200) {
        return responseData;
    }

    return Promise.reject(responseData);
}