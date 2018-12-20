/* eslint-env jest */
jest.mock('../../src/ItemCompletion/ItemCompletionProvider', () => {
  const itemCompletionProvider = jest.fn(() => {
    const instance = {
      start: jest.fn(() => Promise.resolve()),
      stop: jest.fn(),
      completionItems: {},
      restartIfConfigChanged: jest.fn()
    }

    // required to spy on getter
    Object.defineProperty(instance, 'completionItems', {
      get: function () {
        // faked value to check if server returns correct value
        return [{
          label: 'Label',
          kind: 0,
          detail: 'Switch'
        }]
      }
    })

    return instance
  })

  return itemCompletionProvider
})
