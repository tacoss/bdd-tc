@xsnapshot
Feature: Search Engines

Scenario: Searching for "[VALUE]" on [ENGINE]

  Given open "[ENGINE]" URL
  When I search for "[VALUE]"
  Then should I see "[RESULT]"

  Examples:
    ENGINE | VALUE         | RESULT
    # Bing   | agavelab.com  | Agave Lab
    Yahoo  | testcafe.js   | DevExpress
    Google | nightwatch.js | nightwatchjs.org
