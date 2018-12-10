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

export default { Google, Yahoo, Bing };
