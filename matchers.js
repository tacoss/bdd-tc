// FIXME: add common generators for simple values...

function oneOf(dataset, whenField, matchesValue) {
  return dataset.find(x => x[whenField] === matchesValue);
}

function pick(dataset) {
  return dataset[Math.floor(Math.random() * dataset.length)];
}

module.exports = {
  oneOf,
  pick,
};
