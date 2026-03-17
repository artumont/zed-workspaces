#!/usr/bin/env node

import { program } from "commander";
import openWorkspace from "./commands/open";
import createWorkspace from "./commands/create";

program
  .name('zed-workspaces')
  .description('A CLI to open .code-workspace files in Zed editor')
  .version('1.1.0');

program
  .command("create")
  .description("Create a new Zed workspace")
  .argument("[dirs...]", "Directories to include in the workspace (if not provided, it will prompt to select from directories in the current root)")
  .action(async (dirs: string[] = []) => {
    if (await createWorkspace(dirs)) process.exit(0);
    else process.exit(1);
  });

program
  .command("open")
  .description("Open an existing Zed workspace file or select one to open")
  .argument("[file]", "The workspace file to open")
  .action(async (file: string | undefined = undefined) => {
    if (await openWorkspace(file)) process.exit(0);
    else process.exit(1);
  });

// FIXME: Find some way to get the current workspace projects/folders, for now use create
// program.command("save")
//   .description("Save the current Zed workspace (not implemented yet)")
//   .argument("[name]", "The name to save the workspace as (not implemented yet)")
//   .action(async (name: string | undefined = undefined) => {
//     if (await saveCurrentWorkspace(name)) process.exit(0);
//     else process.exit(1);
//   });

program.parse();
