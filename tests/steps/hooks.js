import { Selector } from 'testcafe';
import { takeSnapshot } from 'testcafe-blink-diff';

const sizes = {
  desktop: [1024, 768],
  tablet: [800, 600],
};

const els = {
  changeTitle: Selector('#change-title'),
};

export default {
  matchers: {
    prelude: '(?:Given an initial|Then should I take an)',
  },

  before: {
    resize: ({ media }) => async t => {
      if (media && sizes[media]) {
        await t.resizeWindow(...sizes[media]);
      }
    },
  },

  after: {
    snapshot: () => async t => {
      await takeSnapshot(t);
    },
  },

  'When I click on @$selector': selectorName => async t => {
    await t.click(els[selectorName]);
  },

  '$prelude snapshot for "$snapshot"': snapId => async t => {
    await takeSnapshot(t, { as: snapId });
  },
};
