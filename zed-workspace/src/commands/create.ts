import inquirer from "inquirer";
import fs from "fs";
import path from "path";
import { findAllDirectoriesOnRoot } from "../utils";

/**
 *
 * @param dirs - List of directories to include in the workspace. If empty, the user will be prompted to select from directories in the root.
 * @param workspaceFilePath - The path where the workspace file should be created. If not provided, it will be created in the root with a name based on user input.
 * @returns {string} The path to the created workspace file.
 */
function generateWorkspaceFile(
  dirs: string[],
  workspaceFilePath: string,
): string {
  const workspaceContent = {
    folders: dirs.map((dir) => ({ path: dir })),
    settings: {
      // IDEA: Add some special rules for opening like always open on a new window and stuff like that.
    },
  };

  try {
    fs.writeFileSync(
      workspaceFilePath,
      JSON.stringify(workspaceContent, null, 2),
    );
    return workspaceFilePath;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error creating workspace file: ${error.message}`);
    } else {
      console.error(`Unknown error creating workspace file`);
    }
    return "";
  }
}

export default async function createWorkspace(
  dirs: string[] = [],
  root = process.cwd(),
): Promise<boolean> {
  const nameAnswer = await inquirer.prompt<{ name: string }>([
    {
      type: "input",
      name: "name",
      message: "Enter a name for the new workspace (without extension):",
      validate: (answer: string) => {
        const trimmed = answer.trim();
        if (trimmed === "") {
          return "Workspace name cannot be empty.";
        }
        if (trimmed.includes("/") || trimmed.includes("\\") || trimmed.includes("\0")) {
          return "Workspace name cannot contain path separators or control characters.";
        }
        if (trimmed === "." || trimmed === ".." || trimmed.includes("..")) {
          return 'Workspace name cannot be "." or contain "..".';
        }
        return true;
      },
    },
  ]);
  const name = nameAnswer.name.trim();
  const workspaceFileName = `${name}.code-workspace`;
  const workspaceFilePath = path.join(root, workspaceFileName);
  if (fs.existsSync(workspaceFilePath)) {
    console.error(
      `A workspace with the name "${name}" already exists. Please choose a different name.`,
    );
    return false;
  }

  if (dirs.length === 0) {
    const dirsOnRoot = findAllDirectoriesOnRoot(root);
    if (dirsOnRoot.length === 0) {
      console.error(
        "No directories found in the current root to create a workspace with.",
      );
      return false;
    }

    const dirsAnswer = await inquirer.prompt<{ selectedDirs: string[] }>([
      {
        type: "checkbox",
        name: "selectedDirs",
        message: "Select directories to include in the new workspace:",
        choices: dirsOnRoot,
        validate: (answer: string[]) => {
          if (answer.length === 0) {
            return "Please select at least one directory.";
          }
          return true;
        },
      },
    ]);
    dirs = dirsAnswer.selectedDirs;
  }

  const generatedFile = generateWorkspaceFile(dirs, workspaceFilePath);
  if (generatedFile) {
    console.log(`Workspace successfully created at ${generatedFile}`);
    return true;
  }
  console.error("Failed to create workspace.");
  return false;
}
