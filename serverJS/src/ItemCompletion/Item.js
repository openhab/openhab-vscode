'use strict'
const _ = require('lodash')

class Item {
  constructor (item) {
    this.item = item
  }
  /**
   * The Item name is the unique identified of the Item.
   * The name should only consist of letters, numbers and the underscore character.
   * Spaces and special characters cannot be used.
   * e.g. 'Kitchen_Temperature'
   */
  get name () {
    return this.item.name
  }
  /**
   * The Item type defines which kind of state can be stored in that Item and which commands can be sent to it.
   * Each Item type has been optimized for certain components in your smart home.
   * This optimization is reflected in the data types, and command types.
   *
   * Color|Contact|DateTime|Dimmer|Group|Number|Player|Rollershutter|String|Switch
   */
  get type () {
    return this.item.type
  }
  set type (v) {
    this.item.type = v
  }
  /**
   * The label text has two purposes.
   * First, this text is used to display a description of the specific Item (for example, in the Sitemap).
   * Secondly, the label also includes the value displaying definition for the Item’s state.
   * e.g. "Kitchen thermometer"
   */
  get label () {
    return this.item.label
  }
  /**
   * Item's category. Used for icons
   */
  get category () {
    return this.item.category
  }
  set state (v) {
    this.item.state = v
  }
  /**
   * The state part of the Item definition determines the Item value presentation,
   * e.g., regarding formatting, decimal places, unit display and more.
   * The state definition is part of the Item Label definition and contained inside square brackets.
   * e.g. 'OFF' or '22'
   */
  get state () {
    const nullType = ['NULL', 'UNDEF']
    return !_.includes(nullType, this.item.state) ? this.item.state : ''
  }
  /**
   * Absolute path to the Item in the REST API
   * e.g. 'http://home:8080/rest/items/Ground_Floor'
   */
  get link () {
    return this.item.link.toString()
  }
  /**
   * Relative path to item's icon
   * e.g. '/icon/kitchen?format=svg'
   */
  get icon () {
    let icon = this.item.category || 'none'
    return icon + '.svg'
    // return '/icon/' + icon + '?format=svg'
  }
  /**
   * True if type of the item is equal to 'Group'.
   *
   * The Group is a special Item Type.
   * It is used to define a category or collection in which you can nest/collect other Items or other Groups.
   * Groups are supported in Sitemaps, Automation Rules and other areas of openHAB.
   */
  get isGroup () {
    return this.item.type === 'Group'
  }
  /**
   * True if the item doesn't belong to any group
   */
  get isRootItem () {
    return this.item.groupNames && this.item.groupNames.length === 0
  }
  /**
   * Tags are used by some I/O add-ons.
   * Tags are only of interest if an add-on or integration README explicitly discusses their usage.
   */
  get tags () {
    return this.item.tags
  }
  /**
   * Returns an Array of Groups the item belongs to.
   */
  get groupNames () {
    return this.item.groupNames
  }
  /**
   * True if type of the item is equal to 'Group'
   */
  get members () {
    return this.isGroup && this.item.members
  }
}

module.exports = Item
