const { readFileSync } = require('fs')
const reactDocs = require('react-docgen')

// invalidate require cache so we get template updates as well
export const invalidateModuleCache = filePath => delete require.cache[require.resolve(filePath)]

export const upcaseFirstChar = string => string.charAt(0).toUpperCase() + string.slice(1)

export const extractPropertyDisplayType = type => {
  if (type) {
    if (type.value) {
      if (type.value instanceof Array) {
        return type.value
          .map(subType => extractPropertyDisplayType(subType))
          .join('|')
          .replace(/["']/g, '')
      } else if (type.value instanceof Object) {
        if (type.name === 'arrayOf') {
          return `[${extractPropertyDisplayType(type.value)}]`
        } else if (type.name === 'shape') {
          return `{${Object.keys(type.value).map(key =>
            `${key}:${extractPropertyDisplayType(type.value[key])}`
          ).join(', ')}}`
        } else {
          return extractPropertyDisplayType(type.value)
        }
      } else {
        return upcaseFirstChar(type.value)
      }
    } else if (type.name) {
      if (type.name === 'custom' && type.raw && type.raw.match(/^\w+$/)) {
        return upcaseFirstChar(type.raw)
      }
      return upcaseFirstChar(type.name)
    }
  } else {
    return null
  }
}

export const extractProperties = filePath => {
  const source = readFileSync(filePath)
  const resolver = reactDocs.resolver.findAllExportedComponentDefinitions
  let reactDefinitions
  try {
    reactDefinitions = reactDocs.parse(source, resolver)
  } catch (err) {
    reactDefinitions = []
  }

  const uieProperties = reactDefinitions.reduce((result, reactDefinition) => {
    const reactProps = reactDefinition.props || {}
    const uiengineProps = Object.keys(reactProps).reduce((component, propertyKey) => {
      const { type, description, required, defaultValue } = reactProps[propertyKey]

      component[propertyKey] = {
        type: extractPropertyDisplayType(type),
        default: defaultValue && defaultValue.value.replace(/["']/g, ''),
        description,
        required
      }

      return component
    }, {})

    // only set if there are actual properties defined
    if (Object.keys(uiengineProps).length) {
      result[`<${reactDefinition.displayName}>`] = uiengineProps
    }

    return result
  }, {})

  return uieProperties
}
