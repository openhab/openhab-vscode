#!/usr/bin/env node

/**
 * Preinstall Script - Node Version Manager Setup with Auto-Installation
 *
 * This script:
 * 1. Checks if the installed Node version matches the project requirement (Node 18.x)
 * 2. If incompatible, checks for Volta installation
 * 3. If Volta not found, attempts to automatically install it
 * 4. Configures Volta with the required Node version
 * 5. Exits if environment is not compatible and installation fails
 *
 * Uses Volta for cross-platform Node version management.
 * More info: https://docs.volta.sh/
 */

const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const REQUIRED_NODE_MAJOR = 18;
const REQUIRED_NODE_RANGE = '18';
const VOLTA_VERSION_REQUIRED = '18.20.4';
const packageJsonPath = path.join(__dirname, '..', 'package.json');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getNodeVersion() {
  try {
    return execSync('node --version', { encoding: 'utf-8' }).trim();
  } catch (error) {
    return null;
  }
}

function parseVersion(versionString) {
  const match = versionString.match(/v?(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    full: versionString,
  };
}

function isNodeCompatible(version) {
  if (!version) return false;
  return version.major === REQUIRED_NODE_MAJOR;
}

function isVoltaInstalled() {
  try {
    const result = spawnSync('volta', ['--version'], {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    return result.status === 0;
  } catch {
    return false;
  }
}

function voltaDirectoryExists() {
  const homeDir = process.env.HOME || os.homedir();
  const voltaDir = path.join(homeDir, '.volta');
  try {
    return fs.statSync(voltaDir).isDirectory();
  } catch {
    return false;
  }
}

function getPlatform() {
  return process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'macos' : 'linux';
}

function getInstallationInstructions() {
  const platform = getPlatform();
  const instructions = {
    windows:
      'Please download and run the Windows installer from:\n' +
      '  https://docs.volta.sh/guide/getting-started\n' +
      '  Or use: winget install volta\n' +
      '  Then restart your terminal or PowerShell',
    macos:
      'Please install using Homebrew:\n' +
      '  brew install volta\n' +
      '  Then restart your terminal or run: exec $SHELL',
    linux:
      'Please install using the official installer:\n' +
      '  curl https://get.volta.sh | bash\n' +
      '  Then restart your terminal or run: exec $SHELL',
  };

  return instructions[platform] || instructions.linux;
}

function getAutoInstallCommand() {
  const platform = getPlatform();
  const commands = {
    windows: null, // No automated installation for Windows - requires GUI installer
    macos: 'brew install volta',
    linux: 'curl https://get.volta.sh | bash',
  };

  return commands[platform] || null;
}

function attemptAutoInstall() {
  const platform = getPlatform();
  const command = getAutoInstallCommand();

  if (!command) {
    return false;
  }

  try {
    log(`\n🔧 Attempting to install Volta on ${platform}...`, 'blue');
    execSync(command, { stdio: 'inherit' });
    log('\n✅ Volta installed successfully!', 'green');
    return true;
  } catch (error) {
    log('\n❌ Automatic installation failed.', 'red');
    return false;
  }
}

/**
 * Main preinstall logic
 */
function main() {
  log('\n🔍 Checking Node version compatibility...', 'blue');

  const currentVersion = getNodeVersion();
  if (!currentVersion) {
    log('❌ Unable to determine Node version', 'red');
    process.exit(1);
  }

  const parsedVersion = parseVersion(currentVersion);
  log(`Current Node version: ${currentVersion}`, 'blue');
  log(`Required Node version: ${REQUIRED_NODE_RANGE}.x`, 'blue');

  if (isNodeCompatible(parsedVersion)) {
    log('✅ Node version is compatible', 'green');
    log('', 'reset');
    return;
  }

  // Node version mismatch - not compatible
  log(`\n⚠️  Node version ${currentVersion} does not match required version ${REQUIRED_NODE_RANGE}.x`, 'yellow');

  // Check if Volta was recently installed (directory exists but not in PATH)
  // This happens when user tries `npm install` again in the same terminal after installation
  if (voltaDirectoryExists() && !isVoltaInstalled()) {
    log('\n❌ Terminal restart required!', 'red');
    log('\n📝 Volta was installed, but your shell needs to be restarted to activate it.', 'yellow');
    log('\n🔧 Please:');
    log('   1. Close this terminal', 'yellow');
    log('   2. Open a NEW terminal instance', 'yellow');
    log('   3. Run: npm install', 'yellow');
    log('\n📌 Volta will be automatically available in the new terminal.\n', 'blue');
    process.exit(1);
  }

  if (isVoltaInstalled()) {
    log('✅ Volta is installed', 'green');
    log('\n📝 Volta will automatically manage the correct Node version for this project.', 'blue');
    log('   The project is configured to use Node 18.20.4 via Volta.\n', 'blue');
    return;
  }

  // Volta not installed - attempt automatic installation
  log('\n❌ Volta (Node version manager) is NOT installed.', 'red');
  log('\n📋 Attempting automatic installation...', 'blue');

  const installed = attemptAutoInstall();

  if (installed) {
    log('\n✅ Volta installation complete!', 'green');
    log('\n⚡ Terminal restart required to activate Volta.', 'yellow');
    log('\n🔧 Please:');
    log('   1. Close this terminal', 'yellow');
    log('   2. Open a NEW terminal instance', 'yellow');
    log('   3. Run: npm install', 'yellow');
    log('\n📌 Volta will be automatically available in the new terminal.', 'blue');
    log('   It will manage Node 18.20.4 for this project.\n', 'blue');
    process.exit(1); // Exit - user must restart terminal
  }

  // Auto-install failed - provide manual instructions
  log('\n📋 Please manually install Volta:', 'yellow');
  log(`\n${getInstallationInstructions()}\n`, 'yellow');
  log('📝 After installation, restart your terminal and run: npm install', 'blue');
  log('   Volta will automatically manage Node 18.20.4 for this project.\n', 'blue');

  process.exit(1); // Exit - cannot proceed without compatible Node or Volta
}

main();
