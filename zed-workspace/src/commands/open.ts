import inquirer from "inquirer"
import fs from 'fs';
import path from 'path';
import { exec, spawn } from "child_process";
import { findWorkspacesRecursive, isRunning } from "../utils";

interface folderEntry {
  path?: string;
  uri?: string;
}

function openZedFromWorkspace(filePath: string): boolean { 
  if (!fs.existsSync(filePath)) { 
    console.error(`Workspace file not found at ${filePath}`);
    return false;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const workspaceConfig = JSON.parse(content);
    
    if (!workspaceConfig.folders || !Array.isArray(workspaceConfig.folders)) {
      console.error(`Invalid workspace file format: "folders" property is missing or not an array.`);
      return false;
    }
    
    const workspaceDir = path.dirname(filePath);
        const pathsToOpen = workspaceConfig.folders.map((folder: folderEntry) => {
          // VS Code format usually has 'path' attribute
          const folderPath = folder.path || folder.uri;
          if (!folderPath) {
            console.warn('Warning: Found a folder entry without a "path". Skipping.');
            return null;
          }
          
          // Resolve path relative to the workspace file directory
          return path.resolve(workspaceDir, folderPath);
        }).filter((p: string | null): p is string => p !== null);
    
        if (pathsToOpen.length === 0) {
          console.error('Error: No valid folders found in the workspace file.');
          process.exit(1);
        }
    
    console.log(`Opening ${pathsToOpen.length} folders in Zed...`);
    
    // IDEA: Add a settings check to see if we should do some extra stuff before opening the workspace like opening on a new window or something like that.
    if (isRunning("zed")) {
      const args = [...pathsToOpen, "--reuse"];
      const zedProcess = spawn("zed", args);

      zedProcess.stdout.on("data", (data: Buffer) => {
        console.log(`Zed output: ${data.toString()}`);
      });

      zedProcess.stderr.on("data", (data: Buffer) => {
        console.error(`Error output from Zed: ${data.toString()}`);
      });

      zedProcess.on("error", (error: Error) => {
        console.error(`Error opening workspace in Zed: ${error.message}`);
      });

      return true;
    } else {
      const args = [...pathsToOpen, "--new"];
      const zedProcess = spawn("zed", args);

      zedProcess.stdout.on("data", (data: Buffer) => {
        console.log(`Zed output: ${data.toString()}`);
      });

      zedProcess.stderr.on("data", (data: Buffer) => {
        console.error(`Error output from Zed: ${data.toString()}`);
      });

      zedProcess.on("error", (error: Error) => {
        console.error(`Error opening workspace in Zed: ${error.message}`);
      });

      return true;
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error opening workspace: ${error.message}`);
    } else {
      console.error(`Unknown error opening workspace`);
    }
    return false;
  }
}

export default async function openWorkspace(file: string | undefined = undefined, root: string = process.cwd()): Promise<boolean> {
  if (file === undefined) {
    let workspaceFiles = findWorkspacesRecursive(root);
    if (workspaceFiles.length <=0) {
      console.error("No workspace files found in the current directory or its subdirectories.");
      return false;
    }
    const filesAnswer = await inquirer.prompt<{ selectedFile: string }>([
      {
        type: "list",
        name: "selectedFile",
        message: "Select a workspace file to open:",
        choices: workspaceFiles.map((filePath) => ({
          name: path.relative(root, filePath),
          value: filePath,
        })),
      }
    ])
    file = filesAnswer.selectedFile;
  }
  
  const filePath = path.isAbsolute(file) ? file : path.join(root, file);
  return openZedFromWorkspace(filePath);
}
