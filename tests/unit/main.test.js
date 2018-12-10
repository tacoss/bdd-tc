const fs = require('fs-extra');
const td = require('testdouble');
const mockFs = require('mock-fs');
const { expect } = require('chai');
const compiler = require('../../lib/compiler');

function trim(code) {
  const matches = code.match(/\n( )*/);

  if (!matches) {
    return code;
  }

  const spaces = matches[0].substr(0, matches[0].length - 1);
  const depth = spaces.split('').length;

  return code.replace(new RegExp(`^ {${depth}}`, 'mg'), '').trim();
}

/* global beforeEach, afterEach, describe, it */

describe('compiler', () => {
  let outputFileSync = {};

  beforeEach(() => {
    outputFileSync = {};

    td.replace(fs, 'outputFileSync');
    td.when(fs.outputFileSync(td.matchers.isA(String), td.matchers.isA(String)))
      .thenDo((file, buffer) => {
        outputFileSync[file] = buffer;
      });
  });

  afterEach(() => {
    mockFs.restore();
    td.reset();
  });

  it('should output well-formed test files', () => {
    mockFs({
      'e2e/features/test.feature': trim(`
        @top=foo,bar
        @url=/top
        @before=all
        Feature: Demo

        @url=/page
        @sub=["a", "b", "c"]
        @str="foo, bar, baz, buzz"
        @after=justOne
        Scenario: Test
          When I test
      `),
      'e2e/steps/test.js': trim(`
        export default {
          before: {
            all: () => async t => {},
          },
          after: {
            justOne: () => async t => {},
          },
          'When I test': () => async t => {},
        };
      `),
    });

    compiler({
      srcDir: 'e2e/features',
      destDir: 'tmp/tests/generated',
      stepFiles: ['e2e/steps/test.js'],
    });

    expect(td.explain(fs.outputFileSync).callCount).to.eql(1);

    const buffer = outputFileSync['tmp/tests/generated/test.js'];
    const data = JSON.stringify({
      top: ['foo', 'bar'],
      sub: ['a', 'b', 'c'],
      str: 'foo, bar, baz, buzz',
    });

    expect(buffer).to.to.match(/await.*\[`When I test`\]\(\)\(t\)/);
    expect(buffer).to.contain('before.all({"top":["foo","bar"]})(t)');
    expect(buffer).to.contain(`after.justOne(${data})(t)`);
  });
});
