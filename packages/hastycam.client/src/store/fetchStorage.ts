import { Storage } from 'redux-persist'


const trailing = (s: string, char: string): string => {
    if (s.charAt(s.length - 1) === char) {
        return s;
    }
    return s + char;
}

export class FetchStorage implements Storage {
    private readonly endpoint: string;

    constructor(endpoint: string) {
        // add trailing slash
        this.endpoint = trailing(endpoint, '/');
    }

    getItem(key: string): Promise<string | undefined> {
        console.log('getItem', key);
        
        const url = this.getUrl(key);
        return fetch(url).then(response => response.text());
    }
    
    setItem(key: string, value: any): Promise<void> {
        console.log('setItem', key, value);
        
        const url = this.getUrl(key);
        const options = {
            method: 'POST',
            body: value,
            headers: {
                'Content-Type': 'text/plain'
            }
        };
        return fetch(url, options).then(() => Promise.resolve());
    }

    removeItem(key: string): Promise<void> {
        console.log('removeItem', key);
        
        const url = this.getUrl(key);
        const options = {
            method: 'DELETE',
        };
        return fetch(url, options).then(() => Promise.resolve());
    }

    private getUrl(key: string) {
        return this.endpoint + encodeURIComponent(key);
    }
}
