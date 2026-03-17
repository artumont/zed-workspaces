import fs, { readSync } from "fs";
import path from "path";

/**
 * 
 * @param dir - The directory to search for workspace files. If not provided, it defaults to the current working directory.
 * @param fileList - An array to accumulate found workspace file paths. This is used for the recursive calls and should not be provided by the caller.
 * @returns {string[]} An array of paths to found workspace files.
 */
export function findWorkspacesRecursive(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    if (file === "node_modules" || file.startsWith(".")) continue;
    
    const filePath = path.join(dir, file);
    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        findWorkspacesRecursive(filePath, fileList);
      } else if (file.endsWith(".code-workspace")) {
        fileList.push(filePath);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`Error reading file ${filePath}: ${error.message}`);
      } else {
        console.error(`Unknown error reading file ${filePath}`);
      }
      continue;
    }
  }
  
  return fileList;
}

/**
 * Finds all directories in the specified root directory.
 * @param root - The root directory to search for subdirectories to include in the workspace. If not provided, it defaults to the current working directory.
 * @returns {string[]} An array of directory names.
 */
export function findAllDirectoriesOnRoot(root: string): string[] {
  try {
    const entries = fs.readdirSync(root, { withFileTypes: true });
    return entries
      .filter(
        (entry) =>
          entry.isDirectory() &&
          entry.name !== "node_modules" &&
          !entry.name.startsWith("."),
      )
      .map((dir) => dir.name);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error reading directories in ${root}: ${error.message}`);
    } else {
      console.error(`Unknown error reading directories in ${root}`);
    }
    return [];
  }
}

/**
 * Checks if a program is currently running on the system.
 * @param program - The name of the program to check if it's running. This should be the executable name (e.g., "zed" for Zed editor).
 * @returns {boolean} True if the program is running, false otherwise.
 * @remarks This function uses platform-specific commands to check if the program is running. It supports Windows, macOS, and Linux. If the platform is not supported, it will log a warning and return false.
 */
export function isRunning(program: string): boolean { 
  const platform = process.platform;
  switch (platform) {
    case "win32":
      return isRunningWindows(program);
    case "darwin":
      return isRunningMac(program);
    case "linux":
      return isRunningLinux(program);
    default:
      console.warn(`Unsupported platform: ${platform}. Unable to check if ${program} is running.`);
      return false;
  }  
}

function isRunningWindows(program: string): boolean {
  try {
    const output = require("child_process").execSync(`tasklist /FI "IMAGENAME eq ${program}.exe"`).toString();
    return output.toLowerCase().includes(`${program}.exe`);
  } catch (error) {
    console.error(`Error checking if ${program} is running on Windows: ${error instanceof Error ? error.message : error}`);
    return false;
  }
}

function isRunningMac(program: string): boolean {
  try {
    const output = require("child_process").execSync(`pgrep -x ${program}`).toString();
    return output.trim() !== "";
  } catch (error) {
    return false; // pgrep returns non-zero exit code if the process is not found
  }
}

function isRunningLinux(program: string): boolean {
  try {
    const output = require("child_process").execSync(`pgrep -x ${program}`).toString();
    return output.trim() !== "";
  } catch (error) {
    return false; // pgrep returns non-zero exit code if the process is not found
  }
}
