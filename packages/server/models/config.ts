import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

const CONFIG_FILE_NAME = 'hastyCam.config.json';
const PACKAGE_FILE = 'lerna.json'; // used to understand where the package root lives

const findFile = async (name: string) => {
    let dir = __dirname;

    while(true) {
        const files = await readdir(dir);
        if (files.includes(name)) {
            const filePath = path.join(dir, name);
            return filePath;
        }
        
        // don't look past the main package dir
        if (files.includes(PACKAGE_FILE)) {
            break;
        }

        dir = path.resolve(dir, '..');
    }
    

    throw new Error(`File "${name}" not found, starting from "${__dirname}".`)
};

interface Feed {
    streamUrl: string;
}

class Config {
    filePath: string;

    constructor(filePath: string) {
        this.filePath = filePath;
    }
}

const getConfig = async () => {
    const filePath = await findFile(CONFIG_FILE_NAME);
    return new Config(filePath);
};