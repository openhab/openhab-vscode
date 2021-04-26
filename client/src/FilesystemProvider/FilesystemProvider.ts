import { EventEmitter } from 'vscode';
import { FileSystemError } from 'vscode';
import { Event, FileChangeEvent, Uri, Disposable, FileStat, FileType } from 'vscode';
import {
    FileSystemProvider
} from 'vscode'
import * as YAML from 'yaml'
import { ItemsModel } from '../ItemsExplorer/ItemsModel';
import { ThingsModel } from '../ThingsExplorer/ThingsModel'

export class File implements FileStat {

    type: FileType;
    ctime: number;
    mtime: number;
    size: number;

    name: string;
    data?: Uint8Array;

    constructor(name: string) {
        this.type = FileType.File;
        this.ctime = Date.now();
        this.mtime = Date.now();
        this.size = 0;
        this.name = name;
    }
}

export class Directory implements FileStat {

    type: FileType;
    ctime: number;
    mtime: number;
    size: number;

    name: string;
    entries: Map<string, File | Directory>;

    constructor(name: string) {
        this.type = FileType.Directory;
        this.ctime = Date.now();
        this.mtime = Date.now();
        this.size = 0;
        this.name = name;
        this.entries = new Map();
    }
}

export type Entry = File | Directory;

export class OHFileSystemProvider implements FileSystemProvider {
    private _emitter = new EventEmitter<FileChangeEvent[]>()
    root = new Directory('');

    onDidChangeFile: Event<FileChangeEvent[]> = this._emitter.event

    watch(uri: Uri, options: { recursive: boolean; excludes: string[]; }): Disposable {
        return new Disposable(() => { })
    }
    stat(uri: Uri): FileStat | Thenable<FileStat> {
        if (uri.toString().endsWith('.yaml')) return new File(uri.toString().substring(uri.toString().indexOf('/')))
        return this.root
    }
    readDirectory(uri: Uri): [string, FileType][] | Thenable<[string, FileType][]> {
        if (uri.path !== '/') throw FileSystemError.FileNotFound()
        // temp
        return Promise.resolve([
            ['1.yaml', FileType.File],
            ['2.yaml', FileType.File],
            ['3.yaml', FileType.File],
        ])
    }
    createDirectory(uri: Uri): void | Thenable<void> {
        throw FileSystemError.NoPermissions()
        return Promise.reject('Method not implemented.');
    }
    async readFile(uri: Uri): Promise<Uint8Array> {
        if (!uri.toString().endsWith('.yaml') && !uri.toString().endsWith('.json')) throw FileSystemError.FileIsADirectory()

        try {
            if (uri.path.startsWith('/things/')) {
                const uid = uri.path.replace(/^\/things\//, '').replace(/\.yaml$/, '')
                const thingsModel = new ThingsModel()
                const thing = await thingsModel.get(uid)
                return Buffer.from(`# yaml-language-server: $schema=openhab:/schemas/thing-types/${thing.UID.split(':')[0] + ':' + thing.UID.split(':')[1]}.json\n` + YAML.stringify(thing))
            } else if (uri.path.startsWith('/items/')) {
                const name = uri.path.replace(/^\/items\//, '').replace(/\.yaml$/, '')
                const itemsModel = new ItemsModel()
                const item = await itemsModel.get(name)
                return Buffer.from(YAML.stringify(item))
            }
        } catch (ex) {
            throw FileSystemError.FileNotFound()
        }

        throw FileSystemError.FileNotFound()
    }
    writeFile(uri: Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean; }): void | Thenable<void> {
        throw new Error('Method not implemented.');
    }
    delete(uri: Uri, options: { recursive: boolean; }): void | Thenable<void> {
        throw new Error('Method not implemented.');
    }
    rename(oldUri: Uri, newUri: Uri, options: { overwrite: boolean; }): void | Thenable<void> {
        throw new Error('Method not implemented.');
    }
    copy?(source: Uri, destination: Uri, options: { overwrite: boolean; }): void | Thenable<void> {
        throw new Error('Method not implemented.');
    }
    
}