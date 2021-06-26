const fs = require('fs');
const pixelmatch = require('pixelmatch');
const sharp = require('sharp');
const PNG = require('pngjs').PNG;
const https = require('https');

const agent = new https.Agent({
    keepAlive: true,
    keepAliveMsecs: 1500,
    maxSockets: 1,    
});

const fetchImage = async () => new Promise((resolve, reject) => {
    const options = {
        hostname: 'ipaddr',
        auth: 'user:pass',
        port: 443,
        path: '/cgi-bin/currentpic.cgi',
        method: 'GET',
        rejectUnauthorized: false,
        agent,
    };

    const req = https.request(options, res => {
        // console.log('statusCode:', res.statusCode);
        // console.log('headers:', res.headers);
        if (res.statusCode !== 200) {
            reject(new Error(`Non-200 status: ${res.statusCode}`));
        }

        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
            const result = Buffer.concat(chunks);
            resolve(getImageBuffer(result));
        });
        res.on('error', e => reject(e));
    });

    req.on('error', e => reject(e));
    req.end();
});

const getImageBuffer = async (src) => {
    return sharp(src)
        // .resize(160, 120)
        .ensureAlpha()
        .raw()
        .toBuffer({
            resolveWithObject: true
        });
}

const run = async () => {
    
    const frames = 50;
    const runStart = +new Date();
    let prev = new Uint8ClampedArray((await fetchImage()).data);
    const diffs = [];

    for(let i = 0; i < frames; i++) {
        // const start = +new Date();

        // const img1 = await getImageBuffer('1.jpg');
        const img = await fetchImage();
        const { width, height } = img.info;
        const px = new Uint8ClampedArray(img.data);

        // const diff = new PNG({ width, height });

        // for diff.data, should be able to use Buffer.alloc(px.length) instead of PNG 
        // to avoid size mismatch and remove need to ensureAlpha
        const diffValue = pixelmatch(prev, px, /* diff.data */ null, width, height, {
            threshold: 0.1,
            alpha: 0.3,
            includeAA: true,
        });
        diffs.push(diffValue);

        // setTimeout(() => {
        //     fs.writeFileSync(`diff-${i}.png`, PNG.sync.write(diff));
        // }, 0);

        // const end = +new Date();
        // const elapsed = end - start;
        // const fps = (1000 / elapsed).toFixed(2);
        // console.log({
        //     diffValue,
        //     elapsed,
        //     fps
        // });

        // prep for next loop
        prev = px;
    };

    const runElapsed = (+new Date()) - runStart;
    console.log({
        diffs,
        runElapsed: runElapsed,
        fps: (1000 / (runElapsed / frames)).toFixed(2),
    })
};

run().then(() => console.log('done', new Date()));