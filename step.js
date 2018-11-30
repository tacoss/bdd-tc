import { Selector } from 'testcafe';

const Google = {
  url: 'http://google.com',
  body: Selector('body'),
  search: {
    input: Selector('input[type=text]'),
    submit: Selector('input[name=btnK]'),
    output: Selector('#ires'),
  },
};

const Yahoo = {
  url: 'http://yahoo.com',
  body: Selector('body'),
  search: {
    input: Selector('#uh-search-box'),
    submit: Selector('#uh-search-button'),
    output: Selector('#web'),
  },
};

const Bing = {
  url: 'http://bing.com',
  body: Selector('body'),
  search: {
    input: Selector('#sb_form_q'),
    submit: Selector('#sb_form_go'),
    output: Selector('#b_results'),
  },
};

let page;
const pages = { Google, Yahoo, Bing };

export default {
  'Given open "$searchEngine" URL' ({ searchEngine }) {
    page = pages[searchEngine];

    await t
      .navigateTo(page.url)
      .expect(page.body.visible).ok();
  },

  'When I search for "$searchQuery"' ({ searchQuery }) {
    await t
      .typeText(page.search.input, searchQuery)
      .click(page.search.submit);
  },

  'Then should I see "$searchResult"' ({ searchResult }) {
    await t
      .expect(page.search.output.innerText).contains(searchResult);
  },
};
