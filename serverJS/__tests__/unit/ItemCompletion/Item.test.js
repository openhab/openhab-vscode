/* eslint-env jest */

const Item = require('../../../src/ItemCompletion/Item')

describe('Tests for Item', () => {
  test('Create item and check if methods return expected values', () => {
    const restItem = {
      members: [],
      link: 'http://demo.openhab.org:8080/rest/items/Weather_Chart',
      state: 'NULL',
      editable: false,
      type: 'Group',
      name: 'Weather_Chart',
      tags: [],
      groupNames: []
    }
    const item = new Item(restItem)

    expect(item.item).toBe(restItem)

    expect(item.name).toEqual('Weather_Chart')
    expect(item.type).toEqual('Group')
    expect(item.label).toBeUndefined()
    expect(item.category).toBeUndefined()
    expect(item.state).toEqual('')
    expect(item.link).toEqual('http://demo.openhab.org:8080/rest/items/Weather_Chart')
    expect(item.icon).toEqual('none.svg')
    expect(item.isGroup).toBeTruthy()
    expect(item.isRootItem).toBeTruthy()
    expect(item.tags).toEqual([])
    expect(item.groupNames).toEqual([])
    expect(item.members).toEqual([])
  })

  test('Create item and check special cases', () => {
    const restItem = {
      members: [],
      link: 'http://demo.openhab.org:8080/rest/items/Weather_Chart',
      state: 'UNDEF',
      editable: false,
      type: 'Switch',
      name: 'Weather_Chart',
      tags: [],
      groupNames: ['group5'],
      category: 'window'
    }
    const item = new Item(restItem)

    expect(item.item).toBe(restItem)

    expect(item.state).toEqual('')
    expect(item.icon).toEqual('window.svg')
    expect(item.isRootItem).toBeFalsy()
    expect(item.isGroup).toBeFalsy()
  })
})
