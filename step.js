import { Selector } from 'testcafe';

const GoogleSearchPage = {
  url: 'http://google.com',
  body: Selector('body'),
  search: {
    input: Selector('input[type=text]'),
    submit: Selector('input[name=btnK]'),
    output: Selector('#ires'),
  },
};

let page;
const pages = { GoogleSearchPage };

export default {
  'Given at $pageName' ({ pageName }) {
    page = pages[pageName];

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
