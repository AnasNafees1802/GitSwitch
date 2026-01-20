# GitSwitch

> **One laptop. Many Git accounts. Zero confusion. Zero mistakes.**

A production-ready Electron desktop application that allows developers to manage and switch between multiple Git identities with minimal clicks, while hiding all Git/SSH complexity.

![GitSwitch](https://via.placeholder.com/800x400?text=GitSwitch+Screenshot)

## Features

### 🔍 Automatic Discovery
- Scans your system for existing SSH keys
- Detects Git configurations (global and local)
- Finds repositories on your machine
- Suggests profiles based on discovered identities

### 👤 Profile Management
- Create multiple Git identity profiles
- Support for GitHub, GitLab, Bitbucket, Azure DevOps
- SSH key generation with one click
- Secure token storage in OS keychain

### 📁 Repository Binding
- One-click binding of repos to profiles
- Automatic detection of identity mismatches
- Visual indicators for configuration status
- Batch scanning of project directories

### 🔒 Security First
- Never reads private key contents
- Tokens stored in OS credential vault
- Full backup before every config change
- Complete audit logging
- One-click rollback capability

### 💻 Cross-Platform
- Windows (.exe installer)
- macOS (.dmg) - Coming soon
- Linux (.AppImage/.deb) - Coming soon

## Installation

### From Release
Download the latest release for your platform from the [Releases](https://github.com/yourname/gitswitch/releases) page.

### From Source

```bash
# Clone the repository
git clone https://github.com/yourname/gitswitch.git
cd gitswitch

# Install dependencies
npm install

# Run in development mode
npm run dev

# In another terminal, start Electron
npm run start

# Build for production
npm run build

# Package for Windows
npm run package:win
```

## Development

### Prerequisites
- Node.js 18+
- Git
- npm or pnpm

### Project Structure
```
src/
├── main/                 # Electron main process
│   ├── index.ts          # Entry point
│   ├── preload.ts        # Context bridge
│   ├── ipc/              # IPC handlers
│   ├── services/         # Business logic
│   └── utils/            # Utilities
├── renderer/             # React UI
│   ├── App.tsx           # Root component
│   ├── pages/            # Page components
│   ├── components/       # Reusable components
│   ├── hooks/            # Custom hooks
│   └── styles/           # CSS
└── shared/               # Shared types
    └── types/            # TypeScript types
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development mode |
| `npm run build` | Build for production |
| `npm run start` | Run Electron |
| `npm run package:win` | Create Windows installer |
| `npm run package:mac` | Create macOS installer |
| `npm run package:linux` | Create Linux installer |
| `npm run lint` | Run linter |
| `npm run test` | Run tests |

## Usage

### First Launch
1. GitSwitch will scan your system for existing Git identities
2. Select which identities to import as profiles
3. Start using GitSwitch!

### Create a Profile
1. Go to **Profiles** → **Add Profile**
2. Enter profile name, email, and username
3. Choose authentication (SSH or HTTPS)
4. Optionally generate a new SSH key
5. Add the public key to your Git provider

### Bind a Repository
1. Go to **Repositories** → **Scan for Repos**
2. Click **Bind Profile** on any repository
3. Select the profile to use
4. GitSwitch updates the local git config

### Switch Identities
- The sidebar shows your current default profile
- Click any profile to set it as the new default
- Per-repo bindings override the default

## Security

GitSwitch follows security best practices:

- **Private keys are never read** - We only store paths to keys
- **Tokens use OS keychain** - Windows Credential Manager, macOS Keychain, Linux Secret Service
- **Backups before changes** - Every config modification is backed up first
- **Audit logging** - All actions are logged with timestamps
- **No shell injection** - Commands use safe spawn with array arguments
- **Context isolation** - Renderer process is fully sandboxed

See [SECURITY.md](./SECURITY.md) for the full threat model.

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) first.

## License

MIT License - see [LICENSE](./LICENSE)

## Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- UI powered by [React](https://reactjs.org/)
- Git operations via [simple-git](https://github.com/steveukx/git-js)
- Secure storage with [keytar](https://github.com/atom/node-keytar)

## Author

Created by **Anas Nafees**  
Email: [anasnafees1802@gmail.com](mailto:anasnafees1802@gmail.com)  
YouTube: [SyntacticCode](https://www.youtube.com/@SyntacticCode)
