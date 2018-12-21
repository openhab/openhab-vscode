'use strict'
const vscodeLanguageserver = require('vscode-languageserver')
const Eventsource = require('eventsource')
const request = require('request')
const Item = require('./Item')
const _ = require('lodash')
/**
 * Provides completion items from REST API from openhab instance.
 *
 * Currently only works with http.
 * Example host: http://openhab:8080/rest/items
 *
 * Completion items are cached and updated with SSE
 * http://openhab:8080/rest/events
 *
 * @author Samuel Brucksch
 *
 */
class ItemCompletionProvider {
  /**
   * Start item completion
   *
   * @param host REST API host
   * @param port Port to access REST API
   */
  async start (host, port) {
    this.items = new Map()
    this.status = 'connecting'
    return this.getItemsFromRestApi(host, port)
      .then(() => {
        if (this.status !== 'stopped') {
          this.es = new Eventsource(
            `http://${host}:${port}/rest/events?topics=smarthome/items`
          )
          this.es.addEventListener('message', (...params) =>
            this.event(...params)
          )
        }
      })
      .catch(error => {
        // TODO where to correctly log this?
        console.log(error)
        this.status = 'stopped'
        this.es = undefined
        return error
      })
  }

  stop () {
    if (this.es) {
      this.es.close()
    }
    this.status = 'stopped'
    this.items = undefined
  }

  event (eventPayload) {
    const event = JSON.parse(eventPayload.data)
    event.payload = JSON.parse(event.payload)
    const itemName = event.topic.split('/')[2]
    let item
    switch (event.type) {
      case 'ItemStateEvent':
        // called when openhab reaceives an item state. There is also ItemStateChangedEvent, that only notifies you about changes
        // however the ItemStateChangedEvent is more or less the same as the ItemStateEvent for the change so we do not need to read both
        item = this.items.get(itemName)
        if (item) {
          // add new values to item
          item.state = event.payload.value
          item.type = event.payload.type
          this.items.set(itemName, item)
        }
        break
      case 'ItemUpdatedEvent':
        // update events use an array with 2 elements: array[0] = new, array[1] = old
        // we do not need to compare old and new name as renaming items causes a remove and added event
        // all changes are already in array[0] so we can just overwrite the old item with the new one
        item = new Item(event.payload[0])
        this.items.set(item.name, item)
        break
      case 'ItemAddedEvent':
        item = new Item(event.payload)
        this.items.set(item.name, item)
        // TODO sort as the order changes when adding/removing items
        // REST gives us a sorted list, but when we append with new items, they are not sorted anymore
        break
      case 'ItemRemovedEvent':
        item = event.payload
        this.items.delete(item.name)
        break
      default:
        break
    }
  }

  /**
   * Restarts item completion if host/port changed
   *
   * @param host REST API host
   * @param port Port to access REST API
   */
  async restartIfConfigChanged (host, port) {
    if (host !== this.host || port !== this.port) {
      this.stop()
      const err = await this.start(host, port)
      return err
    }
  }

  /**
   * Returns an array of CompletionItems
   */
  get completionItems () {
    if (this.items) {
      return Array.from(this.items.values()).map(item => {
        return {
          label: item.name,
          kind: vscodeLanguageserver.CompletionItemKind.Variable,
          detail: item.type,
          documentation: this.getDocumentation(item)
        }
      })
    }
    // return empty erray if no map is available
    return []
  }

  /**
   * Indicates if ItemCompletionProvider is already running
   */
  get isRunning () {
    // TODO check again if this is correct
    return (this.es && (this.es.CONNECTING || this.es.OPEN)) || this.status === 'connecting'
  }

  /**
   * Generates a documentation string for the IntelliSense auto-completion
   * Contains Item's label, state, tags and group names.
   * @param item openHAB Item
   */
  getDocumentation (item) {
    const label = item.label ? item.label + ' ' : ''
    const state = item.state ? '(' + item.state + ')' : ''
    const tags = item.tags.length && 'Tags: ' + item.tags.join(', ')
    const groupNames =
      item.groupNames.length && 'Groups: ' + item.groupNames.join(', ')
    const documentation = [(label + state).trim(), tags, groupNames]
    return _.compact(documentation).join('\n')
  }

  getItemsFromRestApi (host, port) {
    this.host = host
    this.port = port
    return new Promise((resolve, reject) => {
      request(
        `http://${host}:${port}/rest/items/`,
        { json: true },
        (err, res, items) => {
          if (err) {
            reject(err)
            return
          }

          if (Array.isArray(items)) {
            items.map(item => {
              this.items.set(item.name, new Item(item))
            })
            return resolve()
          }

          reject(new Error('Could not get valid data from REST API'))
        }
      )
    })
  }
}

module.exports = ItemCompletionProvider
