const compiler = require('./lib/compiler');

const destDir = `${__dirname}/generated`;
const srcDir = `${__dirname}/tests/e2e`;
const copy = [`${__dirname}/tests/e2e/helpers`];
const stepFiles = [`${__dirname}/tests/e2e/steps/searching.js`];

compiler({
  copy,
  srcDir,
  destDir,
  stepFiles,
});
