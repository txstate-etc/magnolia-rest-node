/**
 * Object to make properties more convenient to work with. Magnolia property JSON schema:
 *
 * "property": {
 *   "id": "property",
 *   "properties": {
 *     "name": {
 *       "type": "string"
 *     },
 *     "type": {
 *       "type": "string"
 *     },
 *     "multiple": {
 *       "type": "boolean"
 *     },
 *     "values": {
 *       "type": "array",
 *       "items": {
 *         "type": "string"
 *       }
 *     }
 *   }
 * }
 *
 * This constructor returns a simple name-value pair with the value already converted to the appropriate type. If
 * multiple is true, then the value is an array.
 *
 * @param jsonProperty
 * @constructor
 */
function Property(name, type, value) {
  this.name = name;
  this.type = type;
  this.multiple = value instanceof Array;
  this.value = value;
}

Property.fromMagnoliaProperty = function(magnoliaProperty) {
  let values = magnoliaProperty.values.map(p => convertValueToType(p, magnoliaProperty.type));
  let property = Object.create(Property.prototype);
  property.name = magnoliaProperty.name;
  property.type = magnoliaProperty.type;
  property.multiple = magnoliaProperty.multiple;
  property.value = values.length > 1 ? values : values[0];
  return property;
};

Property.prototype.toMagnoliaProperty = function() {
  let prop = {
    name: this.name,
    type: this.type,
    multiple: this.multiple
  };
  if (this.value instanceof Array) {
    prop.values = this.value.map(convertValueToString);
  } else {
    prop.values = [convertValueToString(this.value)];
  }
  return prop;
};

function convertValueToString(value) {
  return value.toString();
}

function convertValueToType(valueStr, type) {
  switch (type.toUpperCase()) {
    case 'STRING':
    case 'NAME':
    case 'PATH':
    case 'WEAKREFERENCE':
    case 'REFERENCE':
      return valueStr;
    case 'BOOLEAN':
      return valueStr === 'true';
    case 'LONG':
    case 'DOUBLE':
    case 'DECIMAL':
      return Number(valueStr);
    case 'BINARY':
      return 'binary property types are not supported at this time';
    case 'DATE':
      return new Date(valueStr);
    default:
      throw new Error(`Property type ${type} is not supported`)
  }
}

module.exports = Property;
