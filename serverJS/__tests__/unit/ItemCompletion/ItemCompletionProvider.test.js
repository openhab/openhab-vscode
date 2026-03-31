/* eslint-env jest */
require('../../../__mocks__/vscode-languageserver')

jest.mock('eventsource', () => {
  const es = jest.fn(host => {
    return {
      addEventListener: jest.fn()
    }
  })

  return es
})

jest.mock('axios', () => {
  const get = jest.fn(() => {
    const self = get
    if (self.__shouldError) {
      return Promise.reject(self.__error)
    }
    return Promise.resolve({
      data: self.__items
    })
  })

  get.__setError = err => {
    get.__shouldError = true
    get.__error = err
  }

  get.__setItems = items => {
    get.__shouldError = false
    get.__items = items
  }

  get.__clearMock = () => {
    get.__shouldError = false
    get.__error = undefined
    get.__items = undefined
  }

  return {
    get
  }
})

const ItemCompletionProvider = require('../../../src/ItemCompletion/ItemCompletionProvider')
const axios = require('axios')
const Item = require('../../../src/ItemCompletion/Item')

beforeEach(() => {
  jest.clearAllMocks()

  axios.get.__clearMock()
})

describe('Tests for item completion', () => {
  test('.getItemsFromRestApi where request has error', () => {
    const completions = new ItemCompletionProvider()

    axios.get.__setError(new Error('Error'))

    return completions
      .getItemsFromRestApi('localhost', 1234)
      .then(() => {
        // Should never get here
        expect(1).toBe(2)
      })
      .catch(error => {
        expect(axios.get).toHaveBeenCalledTimes(1)
        expect(axios.get).toHaveBeenCalledWith(
          'http://localhost:1234/rest/items/'
        )
        expect(error).toEqual(new Error('Error'))
      })
  })

  test('.getItemsFromRestApi where request does not get valid items', () => {
    const completions = new ItemCompletionProvider()

    // invalid response
    axios.get.__setItems({ items: false })

    return completions
      .getItemsFromRestApi('localhost', 1234)
      .then(() => {
        // should never get here
        expect(1).toBe(2)
      })
      .catch(err => {
        expect(axios.get).toHaveBeenCalledTimes(1)
        expect(axios.get).toHaveBeenCalledWith(
          'http://localhost:1234/rest/items/'
        )
        expect(err).toEqual(new Error('Could not get valid data from REST API'))
      })
  })

  test('.getItemsFromRestApi where request gets empty items array', () => {
    const completions = new ItemCompletionProvider()
    completions.items = new Map()

    // response with empty array (no items on openhab)
    axios.get.__setItems([])

    return completions.getItemsFromRestApi('localhost', 1234).then(() => {
      expect(axios.get).toHaveBeenCalledTimes(1)
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:1234/rest/items/'
      )
      expect(completions.items.size).toBe(0)
    })
  })

  test('.getItemsFromRestApi where request gets valid items array', () => {
    const completions = new ItemCompletionProvider()
    completions.items = new Map()

    axios.get.__setItems([
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

    return completions.getItemsFromRestApi('localhost', 1234).then(() => {
      expect(axios.get).toHaveBeenCalledTimes(1)
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:1234/rest/items/'
      )
      expect(completions.items.size).toBe(3)
    }).catch(() => {
      // should never get here
      expect(1).toBe(2)
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

  test('.restartIfConfigChanged', async () => {
    const completion = new ItemCompletionProvider()
    completion.host = 'localhost'
    completion.port = 1234

    completion.stop = jest.fn()
    completion.start = jest.fn()

    // nothing changes
    let err = await completion.restartIfConfigChanged('localhost', 1234)
    expect(err).toBeUndefined()
    expect(completion.stop).toHaveBeenCalledTimes(0)
    expect(completion.start).toHaveBeenCalledTimes(0)

    // port changes
    err = await completion.restartIfConfigChanged('localhost', 12345)
    expect(err).toBeUndefined()
    expect(completion.stop).toHaveBeenCalledTimes(1)
    expect(completion.start).toHaveBeenCalledTimes(1)
    expect(completion.start).toHaveBeenCalledWith('localhost', 12345)

    // host changes
    err = await completion.restartIfConfigChanged('localhost1', 1234)
    expect(err).toBeUndefined()
    expect(completion.stop).toHaveBeenCalledTimes(2) // this increments as we do not clear the mock inbetween
    expect(completion.start).toHaveBeenCalledTimes(2)
    expect(completion.start).toHaveBeenCalledWith('localhost1', 1234)

    // both changes
    err = await completion.restartIfConfigChanged('text', 0)
    expect(err).toBeUndefined()
    expect(completion.stop).toHaveBeenCalledTimes(3) // this increments as we do not clear the mock inbetween
    expect(completion.start).toHaveBeenCalledTimes(3)
    expect(completion.start).toHaveBeenCalledWith('text', 0)
  })

  test('.completionItems returns empty array if no items map is present', () => {
    const completion = new ItemCompletionProvider()
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
    expect(completion.getDocumentation({ tags: [], groupNames: [] })).toEqual(
      ''
    )

    // label only
    expect(
      completion.getDocumentation({ label: 'label', tags: [], groupNames: [] })
    ).toEqual('label')

    // state only
    expect(
      completion.getDocumentation({ state: 'ON', tags: [], groupNames: [] })
    ).toEqual('(ON)')

    // tag only
    expect(
      completion.getDocumentation({ tags: ['LIGHTING'], groupNames: [] })
    ).toEqual('Tags: LIGHTING')

    // group only
    expect(
      completion.getDocumentation({ tags: [], groupNames: ['group'] })
    ).toEqual('Groups: group')

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

    completion.es = {}
    completion.status = 'connecting'
    expect(completion.isRunning).toBeTruthy()

    completion.es = { CLOSED: true }
    completion.status = undefined
    expect(completion.isRunning).toBeFalsy()

    completion.es = {}
    completion.status = 'stopped'
    expect(completion.isRunning).toBeFalsy()
  })

  test('.event', () => {
    const completion = new ItemCompletionProvider()
    completion.items = new Map()

    // item state event
    completion.event({
      type: 'message',
      data:
        '{"topic":"smarthome/items/MC_Wohnzimmer_Volume/state","payload":"{\\"type\\":\\"Decimal\\",\\"value\\":\\"93\\"}","type":"ItemStateEvent"}',
      lastEventId: '',
      origin: 'http://openhabianpi.local:8080'
    })
    // if no item exists for item state event nothing should happen
    expect(completion.items.size).toBe(0)

    // item added
    completion.event({
      type: 'message',
      data:
        '{"topic":"smarthome/items/TestItem/added","payload":"{\\"type\\":\\"String\\",\\"name\\":\\"TestItem\\",\\"label\\":\\"lala\\",\\"tags\\":[],\\"groupNames\\":[]}","type":"ItemAddedEvent"}',
      lastEventId: '',
      origin: 'http://openhabianpi.local:8080'
    })
    expect(completion.items.size).toBe(1)
    expect(completion.items.get('TestItem')).toEqual({
      item: {
        groupNames: [],
        label: 'lala',
        name: 'TestItem',
        tags: [],
        type: 'String'
      }
    })

    // item updated
    completion.event({
      type: 'message',
      data:
        '{"topic":"smarthome/items/TestItem/updated","payload":"[{\\"type\\":\\"String\\",\\"name\\":\\"TestItem\\",\\"label\\":\\"l1ala\\",\\"tags\\":[],\\"groupNames\\":[]},{\\"type\\":\\"String\\",\\"name\\":\\"TestItem\\",\\"label\\":\\"lala\\",\\"tags\\":[],\\"groupNames\\":[]}]","type":"ItemUpdatedEvent"}',
      lastEventId: '',
      origin: 'http://openhabianpi.local:8080'
    })
    expect(completion.items.size).toBe(1)
    expect(completion.items.get('TestItem')).toEqual({
      item: {
        groupNames: [],
        label: 'l1ala',
        name: 'TestItem',
        tags: [],
        type: 'String'
      }
    })

    // item state event
    completion.event({
      type: 'message',
      data:
        '{"topic":"smarthome/items/TestItem/state","payload":"{\\"type\\":\\"String\\",\\"value\\":\\"BlaBla\\"}","type":"ItemStateEvent"}',
      lastEventId: '',
      origin: 'http://openhabianpi.local:8080'
    })
    // update item
    expect(completion.items.size).toBe(1)
    expect(completion.items.get('TestItem')).toEqual({
      item: {
        groupNames: [],
        label: 'l1ala',
        name: 'TestItem',
        tags: [],
        type: 'String',
        state: 'BlaBla'
      }
    })

    // item state changed event does not change data
    const itembefore = completion.items.get('TestItem')
    completion.event({
      type: 'message',
      data:
        '{"topic":"smarthome/items/TestItem/statechanged","payload":"{\\"type\\":\\"String\\",\\"value\\":\\"lala\\",\\"oldType\\":\\"String\\",\\"oldValue\\":\\"blabla\\"}","type":"ItemStateChangedEvent"}',
      lastEventId: '',
      origin: 'http://openhabianpi.local:8080'
    })
    const itemAfter = completion.items.get('TestItem')
    expect(itembefore).toEqual(itemAfter)

    // item removed
    completion.event({
      type: 'message',
      data:
        '{"topic":"smarthome/items/TestItem/removed","payload":"{\\"type\\":\\"String\\",\\"name\\":\\"TestItem\\",\\"label\\":\\"lala\\",\\"tags\\":[],\\"groupNames\\":[]}","type":"ItemRemovedEvent"}',
      lastEventId: '',
      origin: 'http://openhabianpi.local:8080'
    })
    expect(completion.items.size).toBe(0)

    // any other
    // item state changed event
    completion.event({
      type: 'message',
      data:
        '{"topic":"smarthome/items/TestItem/statechanged","payload":"{\\"type\\":\\"String\\",\\"value\\":\\"lala\\",\\"oldType\\":\\"String\\",\\"oldValue\\":\\"blabla\\"}","type":"ItemStateChangedEvent"}',
      lastEventId: '',
      origin: 'http://openhabianpi.local:8080'
    })
    expect(completion.items.size).toBe(0)
  })

  // Temporarily skip these start/event tests until the server-side request mock is fixed.
  // Tracked in: https://github.com/openhab/openhab-vscode/issues/335
  test.skip('.start() is sucessful', async () => {
    const completion = new ItemCompletionProvider()

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

    const res = await completion.start('localhost', 1234)
    expect(res).toBeUndefined()
    expect(completion.status).toEqual('connecting')
    expect(completion.es.addEventListener).toHaveBeenCalledTimes(1)
    expect(completion.items.size).toBe(3)
  })

  test.skip('.start() is sucessful, empty item array', async () => {
    const completion = new ItemCompletionProvider()

    request.__setItems([])

    const res = await completion.start('localhost', 1234)
    expect(res).toBeUndefined()
    expect(completion.status).toEqual('connecting')
    expect(completion.es.addEventListener).toHaveBeenCalledTimes(1)
    expect(completion.items.size).toBe(0)
  })

  test.skip('.start() is not sucessful, no valid item array', async () => {
    const completion = new ItemCompletionProvider()

    request.__setItems()

    const res = await completion.start('localhost', 1234)
    expect(res).toEqual(new Error('Could not get valid data from REST API'))
    expect(completion.status).toEqual('stopped')
    expect(completion.es).toBeUndefined()
    expect(completion.items.size).toBe(0)
  })

  test.skip('.start() is not sucessful, error in request', async () => {
    const completion = new ItemCompletionProvider()

    request.__setError(new Error('mocked error'))

    const res = await completion.start('localhost', 1234)
    expect(res).toEqual(new Error('mocked error'))
    expect(completion.status).toEqual('stopped')
    expect(completion.es).toBeUndefined()
    expect(completion.items.size).toBe(0)
  })

  test.skip('.event() is called on event', async () => {
    const completion = new ItemCompletionProvider()

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
      }])

    completion.event = jest.fn()
    const res = await completion.start('localhost', 1234)
    expect(res).toBeUndefined()
    const arg1 = completion.es.addEventListener.mock.calls[0][0]
    const callback = completion.es.addEventListener.mock.calls[0][1]
    expect(arg1).toEqual('message')
    const event = {
      type: 'message',
      data:
        '{"topic":"smarthome/items/TestItem/statechanged","payload":"{\\"type\\":\\"String\\",\\"value\\":\\"lala\\",\\"oldType\\":\\"String\\",\\"oldValue\\":\\"blabla\\"}","type":"ItemStateChangedEvent"}',
      lastEventId: '',
      origin: 'http://openhabianpi.local:8080'
    }
    callback(event)
    expect(completion.event).toHaveBeenCalledWith(event)
  })
})
