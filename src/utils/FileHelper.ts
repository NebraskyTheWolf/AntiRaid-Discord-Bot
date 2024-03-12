import fs from "node:fs"

export default class FileHelper {
    public search(path: string): string {
        return fs.readFileSync(path, 'utf-8')
    }
}
