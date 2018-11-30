Feature: Search Engines

Scenario: Searching for "[VALUE]" on [ENGINE]

  Given open "[ENGINE]" URL
  When I search for "[VALUE]"
  Then should I see "[RESULT]"

  Examples:
    ENGINE | VALUE         | RESULT
    Google | testcafe.js   | DevExpress
    Google | nightwatch.js | nightwatchjs.org
