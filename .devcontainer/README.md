# TDD Guard Development Container

A consistent, isolated environment for developing TDD Guard.

## Features

- Network isolation for security
- Pre-configured development tools
- Persistent command history
- Auto-installs dependencies on container creation
- VS Code extensions included (ESLint, Prettier, GitLens, etc.)

## What's Inside

| Component          | Purpose                                         |
| ------------------ | ----------------------------------------------- |
| Node.js 20         | Main CLI & Vitest reporter                      |
| Python 3.11 + pipx | Pytest reporter                                 |
| PHP 8.2 + Composer | PHPUnit reporter                                |
| Claude Code        | AI assistance                                   |
| Dev tools          | Git, zsh, fzf, Docker, gh, vim, nano, git-delta |

**Key files:**

- `Dockerfile` - Container definition
- `devcontainer.json` - IDE configuration
- `init-firewall.sh` - Network security

## Prerequisites

Choose one of:

- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (macOS/Windows/Linux)
- **[Colima](https://github.com/abiosoft/colima)** (macOS)

## Quick Start

### VS Code

1. Install [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
2. Open project → Click green button (bottom-left) → "Reopen in Container"
3. Wait for build → Start coding

[Learn more about VS Code Dev Containers →](https://code.visualstudio.com/docs/devcontainers/containers)

### IntelliJ IDEA (Ultimate only)

1. File → Remote Development → Dev Containers → New Dev Container → From Local Project
2. Select Docker/Colima connection
3. Browse to `<project>/.devcontainer/devcontainer.json`
4. Build Container and Continue

**Resources:**

- [Official documentation →](https://www.jetbrains.com/help/idea/start-dev-container-from-welcome-screen.html)
- [Dev Containers tutorial →](https://blog.jetbrains.com/idea/2024/07/using-dev-containers-in-jetbrains-ides-part-1/)

## Tips & Troubleshooting

### Colima Setup

IntelliJ requires more resources than the default:

```bash
# Basic setup
colima start --cpu 2 --memory 4

# With performance optimization
colima start --cpu 2 --memory 4 --mount-type virtiofs
```

### macOS Performance

For better file performance:

- **Docker Desktop**: Enable VirtioFS in Settings → General → Choose file sharing implementation
- **Colima**: Use `--mount-type virtiofs` flag when starting (see above)

### Git "dubious ownership" error

```bash
git config --global --add safe.directory /workspace
```

### Other notes

- Container preserves command history between sessions
- Network access is restricted for security
- See firewall configuration in `init-firewall.sh` if you need to allow additional services
