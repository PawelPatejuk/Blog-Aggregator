import fs from "fs"
import os from "os"
import path from "path"

export type Config = {
    dbUrl: string
    currentUserName: string
};

export function setUser(currentUserName: string): void {
    const config = readConfig();
    config.currentUserName = currentUserName;
    writeConfig(config);
}

export function readConfig(): Config {
    const filePath = getConfigFilePath();
    const content = fs.readFileSync(filePath, {encoding: 'utf-8'});
    const obj = JSON.parse(content);
    const rawConfig = {
        dbUrl: obj.db_url,
        currentUserName: obj.current_user_name
    }
    const config = validateConfig(rawConfig);
    return config;
}

function getConfigFilePath(): string {
    return path.join(os.homedir(), ".gatorconfig.json");
}

function writeConfig(config: Config): void {
    const filePath = getConfigFilePath();
    const newConfig = {
        "db_url": config.dbUrl,
        "current_user_name": config.currentUserName,
    };
    fs.writeFileSync(filePath, JSON.stringify(newConfig));
}

function validateConfig(rawConfig: any): Config {
    return {
        dbUrl: typeof rawConfig.dbUrl === "string" ? rawConfig.dbUrl : "",
        currentUserName: typeof rawConfig.currentUserName === "string" ? rawConfig.currentUserName : ""
    };
}
