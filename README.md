# Zed Workspaces

A lightweight CLI tool to add VS Code-style `.code-workspace` support to the Zed editor.

Since Zed's native extension API does not currently support window or folder management, this tool bridges the gap by using a Node.js CLI script combined with Zed's Task and Keymap system.

## Setup Instructions

### 1. Install the CLI

First, install the CLI globally so it can be executed from anywhere. Note that you need Node.js installed on your system.

```bash
git clone https://github.com/artumont/zed-workspaces.git zed-workspaces
cd zed-workspaces
pnpm install
npm install -g .
```

### 2. Configure Zed Tasks

To run the workspace manager from within Zed, you need to add it as a Task.

Open your Zed tasks file:
1. Open the Command Palette (`Ctrl-Shift-P` or `Cmd-Shift-P`)
2. Search for "zed: open tasks" (this opens `~/.config/zed/tasks.json`)

Add the following configuration to the `tasks.json` array:

```json
[
  {
    "label": "Open Workspace",
    "command": "zed-workspaces",
    "args": ["open"],
    "use_new_terminal": true
  },
  {
    "label": "Save Workspace",
    "command": "zed-workspaces",
    "args": ["save", "${ZED_WORKTREE_ROOT}"],
    "use_new_terminal": true
  }
]
```

*Note: If `zed-workspaces` is not found after running `npm install -g .`, you may need to specify the absolute path to your global node binaries or use the absolute path to the local `index.js` instead of the global command.*

### 3. Add Keyboard Shortcuts (Optional)

You can assign a keyboard shortcut to instantly trigger the "Open Workspace" task.

Open your Zed keymap file:
1. Open the Command Palette (`Ctrl-Shift-P` or `Cmd-Shift-P`)
2. Search for "zed: open keymap" (this opens `~/.config/zed/keymap.json`)

Add the shortcut under the `Workspace` context:

```json
[
  {
    "context": "Workspace",
    "bindings": {
      "ctrl-shift-o": ["task::Spawn", { "task_name": "Open Workspace" }]
    }
  }
]
```

## Usage

### Opening a Workspace

Press your configured shortcut (`Ctrl+Shift+O` by default), or open the Command Palette, type `task: spawn`, and select `Open Workspace`.

- If your current folder contains exactly one `.code-workspace` file, Zed will launch a new window with all the folders defined in it immediately.
- If your folder contains multiple workspace files, a terminal prompt will appear asking you to select one.
- If it cannot find any workspace file, it will display an error message.

### Saving a Workspace

Open the Command Palette, type `task: spawn`, and select `Save Workspace`.

- A terminal prompt will ask you to name the workspace.
- The CLI will generate a `.code-workspace` file in your root folder.
- You can manually edit this file to add more folders.

## Workspace Format

The CLI uses the standard VS Code workspace format. 
Example `.code-workspace` file:

```json
{
  "folders": [
    {
      "path": ".",
      "name": "Root Folder"
    },
    {
      "path": "../my-other-project",
      "name": "Frontend"
    }
  ],
  "settings": {}
}
```
