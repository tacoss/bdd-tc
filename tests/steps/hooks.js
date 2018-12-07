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
    resize({ media }) {
      if (media && sizes[media]) {
        this.resizeWindow(...sizes[media]);
      }
    },
  },
  after: {
    snapshot() {
      takeSnapshot(this);
    },
  },

  'When I click on @$selector' (selectorName) {
    this.click(els[selectorName]);
  },

  '$prelude snapshot for "$snapshot"' (snapId) {
    takeSnapshot(this, { as: snapId });
  },
};
