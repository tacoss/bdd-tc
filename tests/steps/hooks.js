import { takeSnapshot } from 'testcafe-blink-diff';

const sizes = {
  desktop: [1024, 768],
  tablet: [800, 600],
};

export default {
  before: {
    resize({ media }) {
      if (media && sizes[media]) {
        this.resizeWindow(sizes[media][0], sizes[media][1]);
      }
    },
  },
  after: {
    snapshot() {
      takeSnapshot(this);
    },
  },
};
