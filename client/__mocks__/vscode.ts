/**
 * @author Patrik Gfeller - Initial contribution
 */

/* eslint-env jest */

export const extensions = {
  getExtension: jest.fn((_id: string) => ({ extensionPath: '/mock/extension/path' }))
}

export class EventEmitter<T> {
  private listeners: Array<(e: T) => void> = []
  event = (listener: (e: T) => void) => {
    this.listeners.push(listener)
    return { dispose: () => { } }
  }
  fire(_data: T): void { }
  dispose(): void { }
}

export const workspace = {
  getConfiguration: jest.fn(() => ({
    get: jest.fn((_key: string, defaultValue?: any) => defaultValue !== undefined ? defaultValue : null),
    has: jest.fn(() => false),
    update: jest.fn(() => Promise.resolve()),
    inspect: jest.fn(() => ({ globalValue: undefined, workspaceValue: undefined }))
  })),
  onDidChangeConfiguration: jest.fn()
}

export const window = {
  showErrorMessage: jest.fn(() => Promise.resolve(undefined)),
  showWarningMessage: jest.fn(() => Promise.resolve(undefined)),
  showInformationMessage: jest.fn(() => Promise.resolve(undefined)),
  activeTextEditor: null,
  createOutputChannel: jest.fn(() => ({
    appendLine: jest.fn(),
    append: jest.fn(),
    show: jest.fn(),
    clear: jest.fn(),
    dispose: jest.fn()
  }))
}

export const commands = {
  executeCommand: jest.fn(() => Promise.resolve())
}

export const Uri = {
  parse: jest.fn((url: string) => ({ toString: () => url })),
  file: jest.fn((path: string) => ({ fsPath: path, toString: () => path }))
}

export const ConfigurationTarget = {
  Global: 1,
  Workspace: 2,
  WorkspaceFolder: 3
}

export enum TreeItemCollapsibleState {
  None = 0,
  Collapsed = 1,
  Expanded = 2
}

export class MarkdownString {
  value: string = ''
  appendCodeblock(value: string, _language?: string): this {
    this.value += value
    return this
  }
  appendMarkdown(value: string): this {
    this.value += value
    return this
  }
  appendText(value: string): this {
    this.value += value
    return this
  }
}

export class Hover {
  contents: any
  constructor(contents: any) {
    this.contents = contents
  }
}

export class SnippetString {
  value: string
  constructor(value: string) {
    this.value = value
  }
}
