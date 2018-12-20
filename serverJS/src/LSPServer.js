/**
 * @author Samuel Brucksch
 */
const Server = require('./Server')

const server = new Server()
server.start()

module.exports = {
  server
}
