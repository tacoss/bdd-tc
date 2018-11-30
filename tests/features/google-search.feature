Feature: Demo test Google

Scenario: Open Google and search for "nightwatch js"

  Given at GoogleSearchPage
  When I search for "nightwatch js"
  Then should I see "Node.js powered End-to-End testing framework"
