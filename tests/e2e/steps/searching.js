import pages from '../helpers/pages';

const sizes = {
  desktop: [1024, 768],
  tablet: [800, 600],
};

let page;

export default {
  matchers: {
    find: '(?:search|query)',
  },

  before: {
    resize: ({ media }) => async t => {
      if (media && sizes[media]) {
        await t.resizeWindow(...sizes[media]);
      }
    },
  },

  'Given open "$searchEngine" URL': searchEngine => async t => {
    page = pages[searchEngine];

    await t
      .navigateTo(page.url)
      .expect(page.body.visible).ok();
  },

  'When I $find for "$searchQuery"': searchQuery => async t => {
    await t
      .typeText(page.search.input, searchQuery)
      .click(page.search.submit)
      .wait(500);
  },

  'Then should I see "$searchResult"': searchResult => async t => {
    await t
      .expect(page.search.output.innerText)
      .contains(searchResult);
  },
};
