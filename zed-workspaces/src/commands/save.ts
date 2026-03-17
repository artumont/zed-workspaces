import fs from 'fs';
import inquirer from "inquirer"

export default async function saveCurrentWorkspace(name: string | undefined = undefined): Promise<boolean> { 
  if (name === undefined) {
    const nameAnswer = await inquirer.prompt<{ name: string }>([
      {
        type: "input",
        name: "name",
        message: "Enter a name to save the current workspace as (without extension):",
        validate: (answer: string) => {
          if (answer.trim() === "") {
            return "Workspace name cannot be empty.";
          }
          return true;
        }
      }
    ]);
    name = nameAnswer.name;
  }

  if (!name) {
    return false;
  }

  const fileName = `${name}.json`;
  const fileContents = JSON.stringify({ name }, null, 2);

  try {
    await fs.promises.writeFile(fileName, fileContents, { encoding: "utf8" });
    return true;
  } catch {
    return false;
  }
}
