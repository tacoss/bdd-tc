const compiler = require('./lib/compiler');

const destDir = `${__dirname}/e2e`;
const srcDir = `${__dirname}/tests`;
const copy = [`${__dirname}/tests/helpers`];
const stepFiles = [`${__dirname}/tests/steps/searching.js`];

compiler({
  copy,
  srcDir,
  destDir,
  stepFiles,
});
