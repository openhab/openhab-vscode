/**
 * @author Patrik Gfeller - Initial contribution
 */

import { ItemsExplorer } from '../src/ItemsExplorer/ItemsExplorer'
import { Item } from '../src/ItemsExplorer/Item'

describe('ItemsExplorer.getTreeItem()', () => {
    let explorer: ItemsExplorer

    beforeEach(() => {
        explorer = new ItemsExplorer()
    })

    test('uses item.label as display label when label is non-empty', () => {
        const item = new Item({ name: 'Kitchen_Door', type: 'Contact', state: 'OPEN', label: 'Kitchen door', groupNames: [] })
        const treeItem = explorer.getTreeItem(item)
        expect(treeItem.label).toBe('Kitchen door (OPEN)')
    })

    test('falls back to item.name when label is empty string', () => {
        const item = new Item({ name: 'Kitchen_Door', type: 'Contact', state: 'OPEN', label: '', groupNames: [] })
        const treeItem = explorer.getTreeItem(item)
        expect(treeItem.label).toBe('Kitchen_Door (OPEN)')
    })

    test('omits state parenthetical when state is openHAB NULL', () => {
        const item = new Item({ name: 'Kitchen_Door', type: 'Contact', state: 'NULL', label: 'Kitchen door', groupNames: [] })
        const treeItem = explorer.getTreeItem(item)
        expect(treeItem.label).toBe('Kitchen door')
    })

    test('omits state parenthetical when state is openHAB UNDEF', () => {
        const item = new Item({ name: 'Kitchen_Door', type: 'Contact', state: 'UNDEF', label: 'Kitchen door', groupNames: [] })
        const treeItem = explorer.getTreeItem(item)
        expect(treeItem.label).toBe('Kitchen door')
    })

    test('falls back to name and omits state when both label is empty and state is NULL', () => {
        const item = new Item({ name: 'Kitchen_Door', type: 'Contact', state: 'NULL', label: '', groupNames: [] })
        const treeItem = explorer.getTreeItem(item)
        expect(treeItem.label).toBe('Kitchen_Door')
    })
})
