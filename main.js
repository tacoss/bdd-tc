const compiler = require('./lib/compiler');

const destDir = `${__dirname}/e2e`;
const srcDir = `${__dirname}/tests`;
const stepFiles = [`${__dirname}/tests/steps/searching.js`];

compiler({
  srcDir,
  destDir,
  stepFiles,
});
