import { Selector } from 'testcafe';
import { takeSnapshot } from '../../..';

const els = {
  changeTitle: Selector('#change-title'),
};

export default {
  matchers: {
    prelude: '(?:Given an initial|Then should I take an)',
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
