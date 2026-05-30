'use strict'

const isFunctionLike = (node) => {
  return [
    'FunctionDeclaration',
    'FunctionExpression',
    'ArrowFunctionExpression'
  ].includes(node.type)
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer guard clauses over wrapping an entire function body in a single if statement'
    },
    schema: [],
    messages: {
      preferEarlyReturn: 'Prefer an early return (guard clause) instead of wrapping the entire function body in an if statement.'
    }
  },
  create (context) {
    return {
      IfStatement (node) {
        if (node.alternate) {
          return
        }

        const parent = node.parent
        if (!parent || parent.type !== 'BlockStatement' || parent.body.length !== 1) {
          return
        }

        const functionNode = parent.parent
        if (!functionNode || !isFunctionLike(functionNode)) {
          return
        }

        context.report({
          node,
          messageId: 'preferEarlyReturn'
        })
      }
    }
  }
}
