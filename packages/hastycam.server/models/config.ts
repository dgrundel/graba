import * as fs from 'fs';
import * as path from 'path';

const CONFIG_FILE_NAME = 'app.config.json';
const PACKAGE_FILE = 'lerna.json'; // used to understand where the package root lives

const findFile = (name: string) => {
    let dir = __dirname;

    while(dir !== path.resolve('/')) {
        const files = fs.readdirSync(dir);
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
    name: string;
    streamUrl: string;
}

interface Config {
    feeds: Feed[];
}

export const getConfig = (): Config => {
    return require(findFile(CONFIG_FILE_NAME)) as Config;
};