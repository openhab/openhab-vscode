/* eslint-env jest */
const ItemCompletionProvider = require('../../../src/ItemCompletion/ItemCompletionProvider')
// const request = require('request')

jest.setTimeout(20000)

describe('Integration tests for item completion', () => {
  test('Create and start item completion', async () => {
    const icp = new ItemCompletionProvider()
    const err = await icp.start('demo.openhab.org', 8080)
    expect(err).toBeUndefined()
    expect(icp.isRunning).toBeTruthy()
    expect(icp.items).toBeDefined()
    expect(icp.items.size).toBeGreaterThan(0)

    expect(icp.completionItems).toBeDefined()
    expect(icp.completionItems.length).toBeGreaterThan(0)
    // check one item if it looks like completion items from vscode
    expect(icp.completionItems[0]).toEqual({ detail: expect.anything(String), documentation: expect.anything(String), kind: 6, label: expect.anything(String) })
    icp.stop()
  })

  test('Create and start item completion with localhost where no service is available', async () => {
    // eventsource timeout will fail test because default is 5s
    const icp = new ItemCompletionProvider()
    const err = await icp.start('localhost', 8080)
    expect(err.message).toEqual('connect ECONNREFUSED 127.0.0.1:8080')
    expect(icp.isRunning).toBeFalsy()
    icp.stop()
  })

  // test('Create and start item completion with wrong host', async () => {
  //   // eventsource timeout will fail test because default is 5s
  //   const icp = new ItemCompletionProvider()
  //   const err = await icp.start(123, 8080)
  //   expect(err.message).toEqual('getaddrinfo ENOTFOUND 123 123:8080')
  //   expect(icp.isRunning).toBeFalsy()
  //   icp.stop()
  // })

  // test('Create and start item completion with wrong port', async () => {
  //   // eventsource timeout will fail test because default is 5s
  //   const icp = new ItemCompletionProvider()
  //   const err = await icp.start(123, 'abc')
  //   // seems to fallback to 80 if port is NaN
  //   expect(err.message).toEqual('getaddrinfo ENOTFOUND 123 123:80')
  //   expect(icp.isRunning).toBeFalsy()
  //   icp.stop()
  // })

  test('Restart service', async () => {
    const icp = new ItemCompletionProvider()
    let err = await icp.start('demo.openhab.org', 8080)
    expect(err).toBeUndefined()
    expect(icp.items).toBeDefined()
    expect(icp.items.size).toBeGreaterThan(0)
    expect(icp.isRunning).toBeTruthy()

    err = await icp.restartIfConfigChanged('localhost', 1234)
    expect(err.message).toEqual('connect ECONNREFUSED 127.0.0.1:1234')
    expect(icp.items).toBeDefined()
    expect(icp.items.size).toBe(0)
    expect(icp.isRunning).toBeFalsy()

    err = await icp.restartIfConfigChanged('demo.openhab.org', 8080)
    expect(err).toBeUndefined()
    expect(icp.items).toBeDefined()
    expect(icp.items.size).toBeGreaterThan(0)
    expect(icp.isRunning).toBeTruthy()

    icp.stop()
  })

  test('test events', async () => {
    const icp = new ItemCompletionProvider()
    let err = await icp.start('demo.openhab.org', 8080)
    expect(err).toBeUndefined()
    expect(icp.items).toBeDefined()
    expect(icp.items.size).toBeGreaterThan(0)
    expect(icp.isRunning).toBeTruthy()

    // TODO send state changes, remove, update and create events to REST api and check if we get the results

    icp.stop()
  })
})
