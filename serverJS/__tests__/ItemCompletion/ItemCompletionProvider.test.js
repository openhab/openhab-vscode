/* eslint-env jest */
require('../../__mocks__/vscode-languageserver')

jest.mock('eventsource')

jest.mock('request', () => {
  const request = jest.fn((host, json, cb) => {
    cb(this.error, undefined, this.items)
  })

  request.__setError = err => {
    this.error = err
  }

  request.__setItems = items => {
    this.items = items
  }

  return request
})

const ItemCompletionProvider = require('../../src/ItemCompletion/ItemCompletionProvider')
const request = require('request')
const Item = require('../../src/ItemCompletion/Item')

beforeEach(() => {
  jest.clearAllMocks()

  request.__setItems(undefined)
  request.__setError(undefined)
})

describe('Tests for item completion', () => {
  test('.getItemsFromRestApi where request has error', done => {
    const completions = new ItemCompletionProvider()

    request.__setError(new Error('Error'))

    completions.getItemsFromRestApi('localhost', 1234, err => {
      expect(request).toHaveBeenCalledTimes(1)
      expect(request).toHaveBeenCalledWith('http://localhost:1234/rest/items/', { json: true }, expect.any(Function))
      expect(err).toEqual(new Error('Error'))
      done()
    })
  })

  test('.getItemsFromRestApi where request does not get valid items', done => {
    const completions = new ItemCompletionProvider()

    // invalid response
    request.__setItems({ items: false })

    completions.getItemsFromRestApi('localhost', 1234, err => {
      expect(request).toHaveBeenCalledTimes(1)
      expect(request).toHaveBeenCalledWith('http://localhost:1234/rest/items/', { json: true }, expect.any(Function))
      expect(err).toEqual(new Error('Items is not a valid items array'))
      done()
    })
  })

  test('.getItemsFromRestApi where request gets empty items array', done => {
    const completions = new ItemCompletionProvider()
    completions.items = new Map()

    // response with empty array (no items on openhab)
    request.__setItems([])

    completions.getItemsFromRestApi('localhost', 1234, err => {
      expect(request).toHaveBeenCalledTimes(1)
      expect(request).toHaveBeenCalledWith('http://localhost:1234/rest/items/', { json: true }, expect.any(Function))
      expect(err).toBeUndefined()
      expect(completions.items.size).toBe(0)
      done()
    })
  })

  test('.getItemsFromRestApi where request gets valid items array', done => {
    const completions = new ItemCompletionProvider()
    completions.items = new Map()

    request.__setItems([
      {
        members: [],
        link: 'http://demo.openhab.org:8080/rest/items/Weather_Chart',
        state: 'NULL',
        editable: false,
        type: 'Group',
        name: 'Weather_Chart',
        tags: [],
        groupNames: []
      },
      {
        members: [],
        link: 'http://demo.openhab.org:8080/rest/items/FF_Bathroom',
        state: 'NULL',
        editable: true,
        type: 'Group',
        name: 'FF_Bathroom',
        label: 'Bathroom',
        category: 'bath',
        tags: ['Bathroom'],
        groupNames: ['Home', 'FF']
      },
      {
        members: [],
        link: 'http://demo.openhab.org:8080/rest/items/Status',
        state: 'NULL',
        editable: false,
        type: 'Group',
        name: 'Status',
        tags: [],
        groupNames: []
      }
    ])

    completions.getItemsFromRestApi('localhost', 1234, err => {
      expect(request).toHaveBeenCalledTimes(1)
      expect(request).toHaveBeenCalledWith('http://localhost:1234/rest/items/', { json: true }, expect.any(Function))
      expect(err).toBeUndefined()
      expect(completions.items.size).toBe(3)
      done()
    })
  })

  test('.stop with running eventsource', () => {
    const completions = new ItemCompletionProvider()
    completions.items = {}
    completions.status = 'started'
    completions.es = {
      close: jest.fn()
    }

    completions.stop()
    expect(completions.items).toBeUndefined()
    expect(completions.status).toEqual('stopped')
    expect(completions.es.close).toHaveBeenCalledTimes(1)
  })

  test('.stop without eventsource', () => {
    const completions = new ItemCompletionProvider()
    completions.items = {}
    completions.status = 'started'

    completions.stop()
    expect(completions.items).toBeUndefined()
    expect(completions.status).toEqual('stopped')
  })

  test('.restartIfConfigChanged', () => {
    const completion = new ItemCompletionProvider()
    completion.host = 'localhost'
    completion.port = 1234

    completion.stop = jest.fn()
    completion.start = jest.fn()

    // nothing changes
    completion.restartIfConfigChanged('localhost', 1234)
    expect(completion.stop).toHaveBeenCalledTimes(0)
    expect(completion.start).toHaveBeenCalledTimes(0)

    // port changes
    completion.restartIfConfigChanged('localhost', 12345)
    expect(completion.stop).toHaveBeenCalledTimes(1)
    expect(completion.start).toHaveBeenCalledTimes(1)
    expect(completion.start).toHaveBeenCalledWith('localhost', 12345)

    // host changes
    completion.restartIfConfigChanged('localhost1', 1234)
    expect(completion.stop).toHaveBeenCalledTimes(2) // this increments as we do not clear the mock inbetween
    expect(completion.start).toHaveBeenCalledTimes(2)
    expect(completion.start).toHaveBeenCalledWith('localhost1', 1234)

    // both changes
    completion.restartIfConfigChanged('text', 0)
    expect(completion.stop).toHaveBeenCalledTimes(3) // this increments as we do not clear the mock inbetween
    expect(completion.start).toHaveBeenCalledTimes(3)
    expect(completion.start).toHaveBeenCalledWith('text', 0)
  })

  test('.completionItems returns empty array if no items are present', () => {
    const completion = new ItemCompletionProvider()
    completion.items = new Map()
    expect(completion.completionItems).toEqual([])
  })

  test('.completionItems returns array if items are present', () => {
    const completion = new ItemCompletionProvider()
    completion.items = new Map()
    completion.items.set(
      'Weather_Chart',
      new Item({
        members: [],
        link: 'http://demo.openhab.org:8080/rest/items/Weather_Chart',
        state: 'NULL',
        editable: false,
        type: 'Group',
        name: 'Weather_Chart',
        tags: [],
        groupNames: []
      })
    )

    expect(completion.completionItems).toEqual([
      { detail: 'Group', documentation: '', kind: 6, label: 'Weather_Chart' }
    ])
  })

  test('.getDocumentation', () => {
    const completion = new ItemCompletionProvider()

    // no values available
    expect(completion.getDocumentation({ tags: [], groupNames: [] })).toEqual('')

    // label only
    expect(completion.getDocumentation({ label: 'label', tags: [], groupNames: [] })).toEqual('label')

    // state only
    expect(completion.getDocumentation({ state: 'ON', tags: [], groupNames: [] })).toEqual('(ON)')

    // tag only
    expect(completion.getDocumentation({ tags: ['LIGHTING'], groupNames: [] })).toEqual('Tags: LIGHTING')

    // group only
    expect(completion.getDocumentation({ tags: [], groupNames: ['group'] })).toEqual('Groups: group')

    // mixed
    expect(
      completion.getDocumentation({
        label: 'label',
        state: 'ON',
        tags: ['LIGHTING', 'SWITCH'],
        groupNames: ['group', 'light']
      })
    ).toEqual('label (ON)\nTags: LIGHTING, SWITCH\nGroups: group, light')
  })

  test('.isRunning', () => {
    const completion = new ItemCompletionProvider()

    completion.es = { CONNECTING: true }
    completion.status = undefined
    expect(completion.isRunning).toBeTruthy()

    completion.es = { OPEN: true }
    completion.status = undefined
    expect(completion.isRunning).toBeTruthy()

    completion.es = { }
    completion.status = 'connecting'
    expect(completion.isRunning).toBeTruthy()

    completion.es = { CLOSED: true }
    completion.status = undefined
    expect(completion.isRunning).toBeFalsy()

    completion.es = { }
    completion.status = 'stopped'
    expect(completion.isRunning).toBeFalsy()
  })
})
