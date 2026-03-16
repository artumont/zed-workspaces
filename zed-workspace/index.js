#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const inquirer = require('inquirer');
const json5 = require('json5');
const { spawn } = require('child_process');

program
  .name('zed-workspaces')
  .description('A CLI to open .code-workspace files in Zed editor')
  .version('1.0.0');

// Function to recursively find .code-workspace files
function findWorkspacesRecursive(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    // Skip node_modules and hidden directories to speed up search
    if (file === 'node_modules' || file.startsWith('.')) continue;
    
    const filePath = path.join(dir, file);
    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        findWorkspacesRecursive(filePath, fileList);
      } else if (file.endsWith('.code-workspace')) {
        fileList.push(filePath);
      }
    } catch (e) {
      // Ignore read errors on restricted files
    }
  }
  
  return fileList;
}

// Function to open a workspace file
function openWorkspace(workspacePath) {
  const fullPath = path.resolve(workspacePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`Error: Workspace file not found at ${fullPath}`);
    process.exit(1);
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const workspace = json5.parse(content);

    if (!workspace.folders || !Array.isArray(workspace.folders)) {
      console.error('Error: Invalid workspace file. Missing \"folders\" array.');
      process.exit(1);
    }

    const workspaceDir = path.dirname(fullPath);
    const pathsToOpen = workspace.folders.map(folder => {
      // VS Code format usually has 'path' attribute
      const folderPath = folder.path || folder.uri;
      if (!folderPath) {
        console.warn('Warning: Found a folder entry without a "path". Skipping.');
        return null;
      }
      
      // Resolve path relative to the workspace file directory
      return path.resolve(workspaceDir, folderPath);
    }).filter(p => p !== null);

    if (pathsToOpen.length === 0) {
      console.error('Error: No valid folders found in the workspace file.');
      process.exit(1);
    }

    console.log(`Opening ${pathsToOpen.length} folders in Zed...`);
    
    // Spawn zed with all folder paths
    const zedProcess = spawn('zed', pathsToOpen, {
      stdio: 'inherit',
      shell: true,
      detached: true
    });

    zedProcess.unref();

  } catch (err) {
    console.error(`Error reading or parsing workspace file:`, err.message);
    process.exit(1);
  }
}

program
  .command('open')
  .description('Open a specific .code-workspace file')
  .argument('[file]', 'Path to the .code-workspace file')
  .action((file) => {
    if (file) {
      openWorkspace(file);
    } else {
      // Interactive mode - find workspaces recursively
      const workspaces = findWorkspacesRecursive(process.cwd());

      if (workspaces.length === 0) {
        console.log('No .code-workspace files found in the current directory or subdirectories.');
        console.log('Use "zed-workspaces open <path/to/workspace>" to specify one directly.');
        process.exit(0);
      }

      if (workspaces.length === 1) {
        console.log(`Found one workspace file: ${workspaces[0]}. Opening it...`);
        openWorkspace(workspaces[0]);
      } else {
        // Map absolute paths to paths relative to cwd for cleaner display
        const choices = workspaces.map(ws => {
          const relativePath = path.relative(process.cwd(), ws);
          return {
            name: relativePath,
            value: ws
          };
        });

        inquirer.prompt([
          {
            type: 'list',
            name: 'workspace',
            message: 'Select a workspace to open:',
            choices: choices
          }
        ]).then(answers => {
          openWorkspace(answers.workspace);
        });
      }
    }
  });

program
  .command('save')
  .description('Save the current folders to a .code-workspace file')
  .argument('[directory]', 'The primary directory to save (usually $ZED_WORKTREE_ROOT)')
  .action((directory) => {
    // If no directory provided, default to current working directory
    const targetDir = directory || process.cwd();
    const fullTargetDir = path.resolve(targetDir);

    console.log(`Creating workspace file for: ${fullTargetDir}`);

    inquirer.prompt([
      {
        type: 'input',
        name: 'filename',
        message: 'Enter the name for the workspace file (without extension):',
        default: path.basename(fullTargetDir)
      }
    ]).then(answers => {
      const filename = `${answers.filename}.code-workspace`;
      const destPath = path.join(fullTargetDir, filename);

      if (fs.existsSync(destPath)) {
        console.error(`Error: File ${destPath} already exists.`);
        process.exit(1);
      }

      // In a real multi-root scenario, we'd want to capture multiple folders.
      // Since Zed tasks only reliably pass the active worktree root, we start with that.
      // The user can manually edit the file to add more folders later.
      const workspaceData = {
        folders: [
          {
            path: ".",
            name: path.basename(fullTargetDir)
          }
        ],
        settings: {}
      };

      try {
        // json5 format is standard for .code-workspace but we write standard JSON for simplicity
        fs.writeFileSync(destPath, JSON.stringify(workspaceData, null, 2), 'utf8');
        console.log(`\nSuccess! Created workspace file at: ${destPath}`);
        console.log(`\nYou can now use "zed-workspaces open" or your Open Workspace shortcut to load it.`);
      } catch (err) {
        console.error(`Error writing workspace file:`, err.message);
        process.exit(1);
      }
    });
  });

program.parse();
