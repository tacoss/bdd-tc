const { takeSnapshot } = require('testcafe-blink-diff');
const { Selector } = require('testcafe');

const SHARED_ELS = {};
const SHARED_DATA = {};

function useSelectors(...els) {
  Object.assign(SHARED_ELS, ...els);
}

function useFixtures(...data) {
  Object.assign(SHARED_DATA, ...data);
}

function getVal(innerText, formatter) {
  const matches = innerText.match(/^<(.+?)>$/);

  if (matches) {
    const keys = matches[1].split('.');

    try {
      innerText = SHARED_DATA;

      while (keys.length) {
        innerText = innerText[keys.shift()];
      }
    } catch (e) {
      throw new TypeError(`Unable to retrieve fixture for '${matches[1]}'`);
    }

    if (typeof innerText === 'undefined') {
      throw new TypeError(`Unable to resolve value for '${matches[1]}'`);
    }
  }

  if (typeof formatter === 'function') {
    return formatter(innerText);
  }

  return innerText;
}

function getEl(selector, options) {
  if (!selector) {
    throw new TypeError(`Missing selector, given '${selector}'`);
  }

  return SHARED_ELS[selector] || Selector(selector, options);
}

function $(selector, options) {
  return Selector(selector, options);
}

module.exports = {
  takeSnapshot,
  useSelectors,
  useFixtures,
  getVal,
  getEl,
  $,
};
