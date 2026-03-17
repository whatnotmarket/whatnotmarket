import { promises as fs } from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = process.cwd();
const SOURCE_DIRS = [path.join(ROOT, "src", "app"), path.join(ROOT, "src", "components")];
const OUTPUT_DIR = path.join(ROOT, "src", "i18n", "languages");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "site-master.en.json");

const EXCLUDED_PATH_SEGMENTS = [
  "/src/app/api/",
  "/src/app/(homepage)/",
  "/src/app/inbox/",
  "/src/components/chat/",
  "/src/components/realtime-chat/",
  "/src/components/ui/",
];

const EXCLUDED_STRING_EXACT = new Set<string>([
  "use client",
  "use server",
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
  "en-US",
  "it-IT",
  "de-DE",
]);

const EXCLUDED_TEXT_PATTERNS = [/^inbox$/i, /\bopen inbox\b/i, /\bglobal chat\b/i];

const BLOCKED_JSX_ATTRS = new Set<string>([
  "className",
  "id",
  "src",
  "href",
  "key",
  "role",
  "name",
  "type",
  "value",
  "variant",
  "size",
  "target",
  "rel",
  "onClick",
  "onChange",
  "onSubmit",
  "d",
]);

const TAILWIND_HINTS = [
  "bg-",
  "text-",
  "border-",
  "rounded",
  "p-",
  "px-",
  "py-",
  "pt-",
  "pr-",
  "pb-",
  "pl-",
  "m-",
  "mx-",
  "my-",
  "mt-",
  "mr-",
  "mb-",
  "ml-",
  "w-",
  "h-",
  "min-",
  "max-",
  "grid",
  "flex",
  "inline-",
  "items-",
  "justify-",
  "content-",
  "place-",
  "gap-",
  "space-",
  "overflow-",
  "shadow",
  "ring-",
  "focus:",
  "hover:",
  "active:",
  "disabled:",
  "md:",
  "lg:",
  "xl:",
  "sm:",
  "z-",
  "opacity-",
  "cursor-",
  "transition",
  "duration-",
  "ease-",
];

function normalizePath(filePath: string) {
  return filePath.replace(/\\/g, "/");
}

function shouldSkipFile(filePath: string) {
  const normalized = normalizePath(filePath).toLowerCase();
  if (!/\.(ts|tsx|js|jsx)$/.test(normalized)) return true;
  if (normalized.endsWith(".d.ts")) return true;
  return EXCLUDED_PATH_SEGMENTS.some((segment) => normalized.includes(segment));
}

async function collectFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
      continue;
    }
    if (!entry.isFile()) continue;
    if (shouldSkipFile(fullPath)) continue;
    files.push(fullPath);
  }

  return files;
}

function normalizeText(raw: string) {
  return raw.replace(/\s+/g, " ").trim();
}

function isLikelyClassOrToken(value: string) {
  const normalized = value.trim();
  if (!normalized) return true;
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) return true;
  if (normalized.startsWith("@/") || normalized.startsWith("./") || normalized.startsWith("../")) return true;
  if (normalized.startsWith("/") && !normalized.includes(" ")) return true;
  if (/^#[0-9a-f]{3,8}$/i.test(normalized)) return true;
  if (/^[a-z0-9_.:/()[\]-]+$/i.test(normalized) && !/[A-Z]/.test(normalized) && !normalized.includes(" ")) {
    return true;
  }
  if (!normalized.includes(" ") && TAILWIND_HINTS.some((hint) => normalized.toLowerCase().startsWith(hint))) {
    return true;
  }
  if (
    !normalized.includes(" ") &&
    /(?:hover|focus|active|disabled|sm|md|lg|xl):/i.test(normalized) &&
    normalized.includes("-")
  ) {
    return true;
  }
  if (!normalized.includes(" ") && /^(?:[a-z]+-)+[a-z0-9[\]#./:%-]+$/i.test(normalized)) {
    return true;
  }
  const tokens = normalized.split(/\s+/);
  const tailwindLikeCount = tokens.filter((token) => {
    const lower = token.toLowerCase();
    return (
      lower.includes("[") ||
      lower.includes("]") ||
      lower.includes(":") ||
      TAILWIND_HINTS.some((hint) => lower.startsWith(hint))
    );
  }).length;
  if (tokens.length >= 2 && tailwindLikeCount >= Math.max(2, Math.ceil(tokens.length * 0.5))) {
    return true;
  }
  if (
    tokens.length >= 4 &&
    tokens.every((token) => /[a-z0-9[\]().:/#-]/i.test(token)) &&
    tokens.some((token) => token.includes("-"))
  ) {
    return true;
  }
  return false;
}

function shouldKeepText(value: string) {
  const normalized = normalizeText(value);
  if (!normalized) return false;
  if (normalized.length < 2) return false;
  if (EXCLUDED_STRING_EXACT.has(normalized)) return false;
  if (EXCLUDED_TEXT_PATTERNS.some((pattern) => pattern.test(normalized))) return false;
  if (!/[A-Za-z]/.test(normalized)) return false;
  if (isLikelyClassOrToken(normalized)) return false;
  return true;
}

function isImportLike(node: ts.Node) {
  return (
    ts.isImportDeclaration(node) ||
    ts.isExportDeclaration(node) ||
    ts.isImportEqualsDeclaration(node)
  );
}

function shouldKeepStringLiteralNode(node: ts.StringLiteralLike) {
  const parent = node.parent;
  if (!parent) return false;
  if (isImportLike(parent)) return false;
  if (ts.isJsxAttribute(parent)) {
    const attrName = parent.name.getText();
    if (BLOCKED_JSX_ATTRS.has(attrName)) return false;
  }
  if (ts.isPropertyAssignment(parent) && parent.name === node) return false;
  return true;
}

function toKeyPath(filePath: string) {
  const relative = normalizePath(path.relative(ROOT, filePath));
  const withoutExt = relative.replace(/\.(tsx?|jsx?)$/, "");
  return withoutExt
    .replace(/[()]/g, "")
    .replace(/[^a-zA-Z0-9/_\-.]/g, "")
    .replace(/\//g, ".");
}

async function run() {
  const files = (
    await Promise.all(SOURCE_DIRS.map((dir) => collectFiles(dir)))
  ).flat();

  const dictionary: Record<string, string> = {};

  for (const filePath of files) {
    const source = await fs.readFile(filePath, "utf8");
    const scriptKind = filePath.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, scriptKind);
    const baseKey = toKeyPath(filePath);
    const lineCounter = new Map<number, number>();

    const addEntry = (raw: string, node: ts.Node) => {
      const value = normalizeText(raw);
      if (!shouldKeepText(value)) return;
      const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      const line = position.line + 1;
      const sameLineCount = (lineCounter.get(line) || 0) + 1;
      lineCounter.set(line, sameLineCount);
      const key = `${baseKey}.l${line}.s${sameLineCount}`;
      dictionary[key] = value;
    };

    const visit = (node: ts.Node) => {
      if (ts.isJsxText(node)) {
        addEntry(node.getText(sourceFile), node);
      }

      if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && shouldKeepStringLiteralNode(node)) {
        addEntry(node.text, node);
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  const ordered = Object.fromEntries(
    Object.entries(dictionary).sort(([a], [b]) => a.localeCompare(b))
  );

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(OUTPUT_FILE, `${JSON.stringify(ordered, null, 2)}\n`, "utf8");

  console.log(`Generated ${Object.keys(ordered).length} keys in ${normalizePath(path.relative(ROOT, OUTPUT_FILE))}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
