const JSF = require('json-schema-faker');
const faker = require('faker');
const Chance = require('chance');

const defaults = {
  random: Math.random,
  useDefaultValue: false,
  alwaysFakeOptionals: false,
};

const number = JSF.random.number;
const randexp = JSF.random.randexp;
const shuffle = JSF.random.shuffle;
const date = JSF.random.date;
const pick = JSF.random.pick;
const chance = new Chance();

JSF.extend('faker', () => faker);
JSF.extend('chance', () => chance);

function jsf(schema, options) {
  JSF.option(Object.assign({}, options, defaults));

  return JSF.generate(schema);
}

function gen(typeOf, schema) {
  if (typeOf instanceof RegExp) return randexp(typeOf.source);
  if (typeOf === String) return jsf({ type: 'string', ...schema });
  if (typeOf === Boolean) return jsf({ type: 'boolean', ...schema });
  if (typeOf === Number) return jsf({ type: 'number', ...schema });
  if (typeOf === Array) return jsf({ type: 'array', ...schema });
  if (typeOf === Object) return jsf({ type: 'object', ...schema });

  return jsf({ type: ['string', 'number', 'integer', 'object', 'array', 'boolean', 'null'], ...schema });
}

function oneOf(dataset, whenField, matchesValue) {
  return dataset.find(x => x[whenField] === matchesValue);
}

module.exports = {
  randexp,
  number,
  shuffle,
  date,
  pick,
  oneOf,
  gen,
  jsf,
  faker,
  chance,
};
