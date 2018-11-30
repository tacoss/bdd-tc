import { Selector } from 'testcafe';

const GoogleSearchPage = {
  url: 'http://google.com',
  search: {
    input: Selector('input[type=text]'),
    submit: Selector('button[name=btnG]'),
    output: Selector('#ires'),
  },
};

let page;
const pages = { GoogleSearchPage };

export default {
  'Given at $pageName' ({ pageName }) {
    const PageClass = pages[pageName];

    page = new PageClass();

    await t
      .navigateTo(page.url)
      .expect(this.body.visible).ok();
  },

  'When I search for "$searchQuery"' ({ searchQuery }) {
    await t
      .typeText(page.search.input, searchQuery)
      .click(page.search.submit);
  },

  'Then should I see "$searchResult"' ({ searchResult }) {
    await t
      .expect(this.search.output.innerText).eql(searchResult);
  },
};
