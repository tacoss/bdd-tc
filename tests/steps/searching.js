import pages from '../helpers/pages';

let page;

export default {
  matchers: {
    find: '(?:search|query)',
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
      .click(page.search.submit);
  },

  'Then should I see "$searchResult"': searchResult => async t => {
    await t
      .expect(page.search.output.innerText)
      .contains(searchResult);
  },
};
