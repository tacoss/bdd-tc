Feature: Demo test Google

Scenario: Open Google and search for "agavelab"

  Given at GoogleSearchPage
  When I search for "agavelab"
  Then should I see "Agave Lab: Home"
