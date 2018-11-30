Feature: Demo tests

Scenario: Open Google and search for "agavelab"

  Given open "Google" URL
  When I search for "agavelab"
  Then should I see "Agave Lab: Home"

Scenario: Open Yahoo and search for "agavelab"

  Given open "Yahoo" URL
  When I search for "testcafe.js"
  Then should I see "DevExpress"
