'use strict'

/**
 * WIP this does not do anything yet
 * @param textDocument
 * @param settings
 * @author Samuel Brucksch
 */
const validateTextDocument = (textDocument, settings) => {
  // TODO think about reasonable validations
  let diagnostics = []
  // Send the computed diagnostics to VSCode.
  return { uri: textDocument.uri, diagnostics }
}

module.exports = {
  validateTextDocument
}
