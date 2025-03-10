import * as fs from "fs";
import * as path from "path";

const __filename = path.basename(import.meta.url);
const __dirname = path.dirname(__filename);
const aliasTarget = path.resolve(__dirname, "src");
const targetDir: string = process.argv[2] || "src";
function getJsFiles(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            results = results.concat(getJsFiles(filePath));
        } else if (filePath.endsWith(".ts")) {
            results.push(filePath);
        }
    }
    return results;
}

const files = getJsFiles(targetDir);

files.forEach((file) => {
    const filePath = path.resolve(file);
    const fileDir = path.dirname(filePath);
    const content = fs.readFileSync(filePath, "utf8");

    const updatedContent = content.replace(/from\s+(['"])@\/([^'"]+)\1/g, (match, quote, importSubPath) => {
        const targetAbsolute = path.resolve(aliasTarget, importSubPath);
        let relativePath = path.relative(fileDir, targetAbsolute);
        if (!relativePath.startsWith(".")) {
            relativePath = "./" + relativePath;
        }
        relativePath = relativePath.split(path.sep).join("/");
        return `from ${quote}${relativePath}${quote}`;
    });

    if (content !== updatedContent) {
        fs.writeFileSync(filePath, updatedContent, "utf8");
        console.log(`更新: ${filePath}`);
    }
});
