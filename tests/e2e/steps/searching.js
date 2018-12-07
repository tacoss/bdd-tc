/* eslint space-before-function-paren: 0 */
/* eslint object-shorthand: 0 */

import pages from '../helpers/pages';

let page;

export default {
  matchers: {
    find: '(?:search|query)',
  },

  'Given open "$searchEngine" URL' (searchEngine) {
    page = pages[searchEngine];

    this
      .navigateTo(page.url)
      .expect(page.body.visible).ok();
  },

  'When I $find for "$searchQuery"' (searchQuery) {
    this
      .typeText(page.search.input, searchQuery)
      .click(page.search.submit);
  },

  'Then should I see "$searchResult"' (searchResult) {
    this
      .expect(page.search.output.innerText).contains(searchResult);
  },
};
