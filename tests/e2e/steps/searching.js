import pages from '../helpers/pages';

let page;

export default {
  matchers: {
    find: '(?:search|query)',
  },

  'Given open "$searchEngine" URL' (searchEngine) {
    page = pages[searchEngine];

    await this
      .navigateTo(page.url)
      .expect(page.body.visible).ok();
  },

  'When I $find for "$searchQuery"' (searchQuery) {
    await this
      .typeText(page.search.input, searchQuery)
      .click(page.search.submit);
  },

  'Then should I see "$searchResult"' (searchResult) {
    await this
      .expect(page.search.output.innerText).contains(searchResult);
  },
};
