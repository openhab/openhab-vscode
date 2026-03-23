#!/usr/bin/env node

/**
 * Preinstall Script - Node Version Validation & Version Manager Configuration
 *
 * This script:
 * 1. Parses package.json engines.node field to get required version
 * 2. Checks for other version manager configs (.nvmrc, .node-version, .tool-versions)
 * 3. Validates consistency between version managers
 * 4. Checks if the installed Node version matches the project requirement
 * 5. If incompatible, checks for Volta installation
 * 6. If Volta is managing the current Node, configures it with `volta pin node@<version>`
 * 7. If Volta is installed but not active, alerts the user to restart terminal
 * 8. Guides users to manually install Volta via environment variable opt-in
 *
 * Uses Volta for cross-platform Node version management (manual installation).
 * More info: https://docs.volta.sh/
 */

const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const packageJsonPath = path.resolve(__dirname, '../package.json');
const projectRoot = path.dirname(packageJsonPath);

// Version manager config file paths
const VERSION_MANAGER_CONFIGS = {
  volta: path.join(projectRoot, 'package.json'),
  nvm: path.join(projectRoot, '.nvmrc'),
  nodenv: path.join(projectRoot, '.node-version'),
  asdf: path.join(projectRoot, '.tool-versions'),
};

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
  const version = process.version;
  if (typeof version === 'string') {
    return version.trim();
  }
  return null;
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

/**
 * Extracts major version requirement from a version specification string
 * Handles formats like: "20", ">=20", "20.12.0", "^20.0.0", etc.
 * Returns the minimum major version required
 *
 * @param {string} versionSpec - Version specification (e.g., ">=20", "^20.12.0")
 * @returns {number|null} Major version or null if unparseable
 */
function extractMajorVersion(versionSpec) {
  if (!versionSpec || typeof versionSpec !== 'string') return null;

  // Remove operators: >=, >, <=, <, ^, ~, =
  const cleanVersion = versionSpec.replace(/^[><=^~]+/, '').trim();

  // Extract major version number
  const match = cleanVersion.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Reads the required Node version from package.json engines.node field
 *
 * @returns {object|null} Object with {version: string, major: number} or null
 */
function readNodeVersionFromPackageJson() {
  try {
    const packageContent = fs.readFileSync(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(packageContent);
    const nodeVersion = pkg.engines?.node?.trim();

    if (nodeVersion) {
      const major = extractMajorVersion(nodeVersion);
      if (major !== null) {
        return { version: nodeVersion, major };
      }
    }

    log(`⚠️  package.json engines.node is missing or invalid`, 'yellow');
    return null;
  } catch {
    log(`⚠️  Unable to read package.json`, 'yellow');
    return null;
  }
}

/**
 * Reads version from .nvmrc file (nvm - Node Version Manager)
 * Returns the single version line
 *
 * @returns {object|null} Object with {source: 'nvm', version: string, major: number} or null
 */
function readNvmrcVersion() {
  try {
    if (fs.existsSync(VERSION_MANAGER_CONFIGS.nvm)) {
      const content = fs.readFileSync(VERSION_MANAGER_CONFIGS.nvm, 'utf-8').trim();
      const major = extractMajorVersion(content);
      if (major !== null) {
        return { source: 'nvm', version: content, major };
      }
    }
  } catch {
    // File not readable, ignore
  }
  return null;
}

/**
 * Reads version from .node-version file (nodenv)
 * Returns the single version line
 *
 * @returns {object|null} Object with {source: 'nodenv', version: string, major: number} or null
 */
function readNodeenvVersion() {
  try {
    if (fs.existsSync(VERSION_MANAGER_CONFIGS.nodenv)) {
      const content = fs.readFileSync(VERSION_MANAGER_CONFIGS.nodenv, 'utf-8').trim();
      const major = extractMajorVersion(content);
      if (major !== null) {
        return { source: 'nodenv', version: content, major };
      }
    }
  } catch {
    // File not readable, ignore
  }
  return null;
}

/**
 * Reads version from .tool-versions file (asdf)
 * Extracts the nodejs version line
 *
 * @returns {object|null} Object with {source: 'asdf', version: string, major: number} or null
 */
function readAsdfVersion() {
  try {
    if (fs.existsSync(VERSION_MANAGER_CONFIGS.asdf)) {
      const content = fs.readFileSync(VERSION_MANAGER_CONFIGS.asdf, 'utf-8');
      const nodeLine = content.split('\n').find((line) => line.startsWith('nodejs '));
      if (nodeLine) {
        const version = nodeLine.replace(/^nodejs\s+/, '').trim();
        const major = extractMajorVersion(version);
        if (major !== null) {
          return { source: 'asdf', version, major };
        }
      }
    }
  } catch {
    // File not readable, ignore
  }
  return null;
}

/**
 * Collects all version manager configurations and validates consistency
 *
 * @returns {object} Aggregated version info with {packageJson, nvm, nodenv, asdf}
 */
function collectVersionManagerConfigs() {
  const configs = {
    packageJson: readNodeVersionFromPackageJson(),
    nvm: readNvmrcVersion(),
    nodenv: readNodeenvVersion(),
    asdf: readAsdfVersion(),
  };

  return configs;
}

/**
 * Validates consistency of version specifications across version managers
 * Returns true if all found configs agree on major version requirement
 *
 * @param {object} configs - Version manager configs from collectVersionManagerConfigs()
 * @returns {boolean} true if versions are consistent or only one source exists
 */
function validateVersionConsistency(configs) {
  const versions = Object.values(configs).filter((v) => v !== null);

  if (versions.length <= 1) {
    return true; // 0 or 1 source, no conflict
  }

  const majors = new Set(versions.map((v) => v.major));
  return majors.size === 1; // All have same major version
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

/**
 * Configures Volta to pin the specified Node version
 * Executes `volta pin node@<version>` command
 *
 * @param {string} nodeVersion - The Node version to pin (e.g., "20" or "20.12.0")
 * @returns {boolean} true if configuration succeeded, false otherwise
 */
function configureVoltaWith(nodeVersion) {
  try {
    const result = spawnSync('volta', ['pin', `node@${nodeVersion}`], {
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    if (result.status === 0) {
      log(`✅ Volta configured with Node ${nodeVersion}`, 'green');
      return true;
    }

    // Command failed - log stderr if available
    const errorMsg = result.stderr || 'Unknown error';
    log(`⚠️  Volta configuration failed: ${errorMsg}`, 'yellow');
    return false;
  } catch (error) {
    log(`⚠️  Unable to execute Volta configuration: ${error.message}`, 'yellow');
    return false;
  }
}



/**
 * Detects if running in a CI/CD environment
 * Checks for common CI/CD environment variables
 *
 * @returns {boolean} true if running in CI/CD, false otherwise
 */
function isCI() {
  // Azure Pipelines sets TF_BUILD=True
  if (process.env.TF_BUILD === 'True') return true;
  // GitHub Actions
  if (process.env.GITHUB_ACTIONS === 'true') return true;
  // GitLab CI
  if (process.env.GITLAB_CI === 'true') return true;
  // Jenkins
  if (process.env.JENKINS_HOME) return true;
  // General CI environment variable
  if (process.env.CI === 'true' || process.env.CI === '1') return true;
  return false;
}

/**
 * Main preinstall logic
 */
function main() {
  // Skip Node version validation in CI/CD environments
  // CI/CD systems have their own Node version constraints via package.json engines field
  if (isCI()) {
    log('ℹ️  CI/CD environment detected (TF_BUILD, GITHUB_ACTIONS, GITLAB_CI, etc.)', 'blue');
    log('   Skipping Node version validation. Deployment will enforce engine constraints.\n', 'blue');
    return;
  }

  // Collect version specifications from all version managers
  const versionConfigs = collectVersionManagerConfigs();

  // Validate consistency across version managers
  if (!validateVersionConsistency(versionConfigs)) {
    log('\n⚠️  Version manager config mismatch detected!', 'yellow');
    log('\n📋 Found different Node versions in:');
    if (versionConfigs.packageJson) {
      log(`   • package.json: Node ${versionConfigs.packageJson.version}`, 'yellow');
    }
    if (versionConfigs.nvm) {
      log(`   • .nvmrc: Node ${versionConfigs.nvm.version}`, 'yellow');
    }
    if (versionConfigs.nodenv) {
      log(`   • .node-version: Node ${versionConfigs.nodenv.version}`, 'yellow');
    }
    if (versionConfigs.asdf) {
      log(`   • .tool-versions: Node ${versionConfigs.asdf.version}`, 'yellow');
    }
    log('\n🔧 Recommendation: Synchronize all version manager configs to use the same Node version.', 'blue');
    log('   Update .nvmrc, .node-version, and .tool-versions to match package.json.\n', 'blue');
  }

  // Use package.json as the source of truth for required version
  if (!versionConfigs.packageJson) {
    log('❌ Unable to determine required Node version from package.json', 'red');
    process.exit(1);
  }

  const requiredNodeVersion = versionConfigs.packageJson;
  const voltaVersionRequired = requiredNodeVersion.version;

  log('\n🔍 Checking Node version compatibility...', 'blue');

  const currentVersion = getNodeVersion();
  if (!currentVersion) {
    log('❌ Unable to determine Node version', 'red');
    process.exit(1);
  }

  const parsedVersion = parseVersion(currentVersion);
  log(`Current Node version: ${currentVersion}`, 'blue');
  log(`Required Node version: ${voltaVersionRequired}`, 'blue');

  if (parsedVersion && parsedVersion.major === requiredNodeVersion.major) {
    log('✅ Node version is compatible', 'green');
    log('', 'reset');
    return;
  }

  // Node version mismatch - not compatible
  log(`\n⚠️  Node version ${currentVersion} does not match required version ${voltaVersionRequired}`, 'yellow');

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
    // Volta is installed, verify that the current node is managed by Volta
    let usingVoltaNode = false;
    // Step 1: Try to get Volta's node path
    let voltaNodePath = null;
    try {
      voltaNodePath = execSync('volta which node', { encoding: 'utf8' }).trim();
    } catch (e) {
      // volta which node failed — Volta may be corrupted or misconfigured
      log('❌ Volta command failed unexpectedly.', 'red');
      log('\n📝 The Volta installation may be corrupted or misconfigured.', 'yellow');
      log('\n🔧 To fix this:');
      log('   1. Run: volta --version', 'yellow');
      log('   2. If it fails, reinstall Volta:', 'yellow');
      log(`\n${getInstallationInstructions()}\n`, 'yellow');
      log('📝 Then restart your terminal and run: npm install', 'blue');
      process.exit(1);
    }

    // Step 2: If volta which node succeeded, compare paths
    if (voltaNodePath) {
      try {
        const resolvedVoltaNode = fs.realpathSync(voltaNodePath);
        const resolvedCurrentNode = fs.realpathSync(process.execPath);
        usingVoltaNode = resolvedVoltaNode === resolvedCurrentNode;
      } catch (e) {
        // fs.realpathSync failed — filesystem or permission issue
        log('❌ Unable to verify Volta node path.', 'red');
        log('\n📝 A filesystem error occurred while checking the Volta installation.', 'yellow');
        log(`\n⚠️  Error: ${e.message}`, 'yellow');
        log('\n🔧 To fix this:');
        log('   1. Check your filesystem permissions', 'yellow');
        log('   2. Ensure ~/.volta directory is accessible', 'yellow');
        log('   3. Try restarting your terminal', 'yellow');
        log('   4. If the issue persists, reinstall Volta:', 'yellow');
        log(`\n${getInstallationInstructions()}\n`, 'yellow');
        process.exit(1);
      }
    }

    if (usingVoltaNode) {
      log('✅ Volta is installed and managing the current Node process', 'green');
      log('\n🔧 Configuring Volta...', 'blue');
      configureVoltaWith(voltaVersionRequired);
      log('\n📝 Volta will automatically manage the correct Node version for this project.', 'blue');
      log(`   The project is configured to use Node ${voltaVersionRequired} via Volta.\n`, 'blue');
      return;
    }

    log('❌ Volta is installed, but the current Node process is not managed by Volta.', 'red');
    log('\n📝 Your system has a non-Volta Node in use.', 'yellow');
    log('\n🔧 To fix this (recommended for local development):');
    log('   1. Close this terminal', 'yellow');
    log('   2. Open a NEW terminal instance', 'yellow');
    log('   3. Run: npm install', 'yellow');
    log('\n📌 A new terminal will activate Volta and use the correct Node version.', 'blue');
    log('\n⚠️  Proceeding with Node version mismatch. Node version enforcement is disabled for CI/CD builds.\n', 'yellow');
  }

  // Volta not installed - provide manual installation instructions
  log('\n⚠️  Volta (Node version manager) is NOT installed.', 'yellow');
  log(`\n📋 Volta is recommended to manage Node ${requiredNodeVersion.major} for this project.`, 'yellow');
  log('\n🔧 To enable automatic installation during npm install, set the environment variable:', 'blue');
  log('   export VOLTA_INSTALL=1', 'yellow');
  log('   npm install', 'yellow');
  log('\n📋 Or manually install Volta:', 'yellow');
  log(`\n${getInstallationInstructions()}\n`, 'yellow');
  log('📝 After installation, restart your terminal and run: npm install', 'blue');
  log(`   Volta will automatically manage Node ${voltaVersionRequired} for this project.\n`, 'blue');

  log('⚠️  Proceeding with Node version mismatch. Node version enforcement is disabled for CI/CD builds.', 'yellow');
  log('   Local development: install Volta for optimal compatibility.\n', 'yellow');
}

main();
