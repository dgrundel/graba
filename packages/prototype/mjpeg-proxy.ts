// Copyright (C) 2013, Georges-Etienne Legendre <legege@legege.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

import * as http from 'http';

const BOUNDARY_IDENT = 'boundary=';
const CR_HEX = 0x0d;
const LF_HEX = 0x0a;

const extractBoundary = (contentType: string) => {
    const value = contentType.replace(/\s+/g, '');
    const start = value.indexOf(BOUNDARY_IDENT);
    
    let end = value.indexOf(';', start);
    if (end === -1) { //boundary is the last option
        // some servers, like mjpeg-streamer puts a '\r' character at the end of each line.
        const crIndex = value.indexOf('\r', start);
        end = crIndex !== -1 ? crIndex : value.length;
    }

    return value.substring(start + BOUNDARY_IDENT.length, end)
        .replace(/"/gi, '')
        .replace(/^\-\-/gi, '');
}

export class Proxy {
    readonly requestUrl: URL;
    readonly listeners: http.ServerResponse[];
    readonly newListeners: http.ServerResponse[];
    boundary: string;
    globalMjpegResponse: http.IncomingMessage;
    mjpegRequest: http.ClientRequest;

    constructor(mjpegUrl: string) {
        this.requestUrl = new URL(mjpegUrl);
        this.listeners = [];
        this.newListeners = [];
        this.boundary = null;
        this.globalMjpegResponse = null;
        this.mjpegRequest = null;
    }

    proxyRequest(req: http.IncomingMessage, res: http.ServerResponse) {
        if (res.socket == null) {
            return;
        }

        // There is already another client consuming the MJPEG response
        if (this.mjpegRequest !== null) {
            this.addListener(res);
            return;
        } 
        
        // Send source MJPEG request
        this.mjpegRequest = http.request(this.requestUrl, (mjpegResponse: http.IncomingMessage) => {
            // console.log(`statusCode: ${mjpegResponse.statusCode}`)
            const boundary = extractBoundary(mjpegResponse.headers['content-type']);
            const fullBoundary = '--' + this.boundary;
            
            this.globalMjpegResponse = mjpegResponse;
            this.boundary = boundary;

            this.addListener(res);

            let lastByte1: number = null;
            let lastByte2: number = null;

            mjpegResponse.on('data', (chunk: any) => {
                // Fix CRLF issue on iOS 6+: boundary should be preceded by CRLF.
                const buff = Buffer.from(chunk);

                if (lastByte1 != null && lastByte2 != null) {
                    const boundaryStart = buff.indexOf(fullBoundary);

                    if (boundaryStart === 0 && !(lastByte2 == CR_HEX && lastByte1 == LF_HEX) || boundaryStart > 1 && !(chunk[boundaryStart - 2] == CR_HEX && chunk[boundaryStart - 1] == LF_HEX)) {
                        // insert the missing CRLF
                        chunk = Buffer.concat([
                            chunk.slice(0, boundaryStart), 
                            Buffer.from('\r\n' + fullBoundary), 
                            chunk.slice(boundaryStart + fullBoundary.length)
                        ]);
                    }
                }

                lastByte1 = chunk[chunk.length - 1];
                lastByte2 = chunk[chunk.length - 2];

                for (let i = this.listeners.length; i--;) {
                    const res = this.listeners[i];

                    const isNewListener = this.newListeners.indexOf(res) !== -1;
                    if (isNewListener) {
                        // First time we push data... lets start at a boundary
                        const boundaryStart = buff.indexOf(fullBoundary);
                        if (boundaryStart !== -1) {
                            res.write(chunk.slice(boundaryStart));

                            // remove from new
                            this.newListeners.splice(this.newListeners.indexOf(res), 1); 
                        }
                    } else {
                        // write whole chunk for existing listeners
                        res.write(chunk);
                    }
                }
            });

            mjpegResponse.on('end', () => {
                // console.log("...end");
                let i = this.listeners.length;
                while (i--) {
                    this.listeners[i].end();
                }
            });
            
            mjpegResponse.on('close', () => {
                // console.log("...close");
            });
        });

        this.mjpegRequest.on('error', (e) => {
            console.error('problem with request: ', e);
        });
        this.mjpegRequest.end();
    }
    
    addListener(res: http.ServerResponse) {
        res.writeHead(200, {
            'Expires': 'Mon, 01 Jul 1980 00:00:00 GMT',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Content-Type': 'multipart/x-mixed-replace;boundary=' + this.boundary
        });

        this.listeners.push(res);
        this.newListeners.push(res);

        res.socket.on('close', () => {
            // console.log('exiting client!');

            this.listeners.splice(this.listeners.indexOf(res), 1);
            if (this.newListeners.indexOf(res) >= 0) {
                this.newListeners.splice(this.newListeners.indexOf(res), 1); // remove from new
            }

            if (this.listeners.length == 0) {
                this.destroyGlobals();
            }
        });
    }

    private destroyGlobals() {
        this.mjpegRequest = null;
        if (this.globalMjpegResponse) {
            this.globalMjpegResponse.destroy();
        }
    }
}