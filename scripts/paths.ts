import * as fs from "fs";
import * as path from "path";

// エイリアスの設定
const aliasPrefix = "@/";
const __filename = path.basename(import.meta.url);
const __dirname = path.dirname(__filename);
// プロジェクトルートの src フォルダへの絶対パス（必要に応じて変更してください）
const aliasTarget = path.resolve(__dirname, "src");

// 対象ディレクトリ（コマンドライン引数の 1 番目、未指定なら "dist" とする）
const targetDir: string = process.argv[2] || "dist";

/**
 * 指定ディレクトリ内を再帰的に走査し、.js ファイルのパス一覧を返す
 * @param dir 対象ディレクトリのパス
 */
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

    // 各ファイルごとに、"from '@/xxx'" をそのファイルからの相対パスに変換する
    const updatedContent = content.replace(/from\s+(['"])@\/([^'"]+)\1/g, (match, quote, importSubPath) => {
        // "@/xxx" の部分を、aliasTarget(= src) からの絶対パスに変換
        const targetAbsolute = path.resolve(aliasTarget, importSubPath);
        // 現在のファイル位置から targetAbsolute への相対パスを計算
        let relativePath = path.relative(fileDir, targetAbsolute);
        // 結果が "." で始まらない場合は "./" を付与（例: "utils/foo.js" → "./utils/foo.js"）
        if (!relativePath.startsWith(".")) {
            relativePath = "./" + relativePath;
        }
        // OS依存のパス区切り文字を "/" に統一
        relativePath = relativePath.split(path.sep).join("/");
        return `from ${quote}${relativePath}${quote}`;
    });

    if (content !== updatedContent) {
        fs.writeFileSync(filePath, updatedContent, "utf8");
        console.log(`更新: ${filePath}`);
    }
});
