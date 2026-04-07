/**
 * Packaging script: stages build outputs into a minimal app directory,
 * then calls @electron/packager to produce the distributable folder.
 *
 * Bypasses electron-builder's winCodeSign requirement entirely.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const stagingDir = path.join(root, ".staging");
const releaseDir = path.join(root, "release");

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log("Staging build outputs...");

if (fs.existsSync(stagingDir)) fs.rmSync(stagingDir, { recursive: true });
fs.mkdirSync(stagingDir);

copyDir(path.join(root, "dist"), path.join(stagingDir, "dist"));
copyDir(path.join(root, "dist-electron"), path.join(stagingDir, "dist-electron"));

fs.writeFileSync(
  path.join(stagingDir, "package.json"),
  JSON.stringify({ name: "easytab", version: "1.0.0", main: "dist-electron/main.js" }, null, 2)
);

console.log("Running @electron/packager...");

const cmd = [
  "npx electron-packager",
  `"${stagingDir}"`,
  "easyTAB",
  "--platform=win32",
  "--arch=x64",
  `--out="${releaseDir}"`,
  "--overwrite",
  "--electron-version=33.4.11",
].join(" ");

execSync(cmd, { stdio: "inherit", cwd: root });

fs.rmSync(stagingDir, { recursive: true });

console.log(`\nDone. Executable located at: ${path.join(releaseDir, "easyTAB-win32-x64", "easyTAB.exe")}`);
