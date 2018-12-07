@before=resize
@after=snapshot

Feature: Demo tests

@tags=agave,search
@media=desktop

Scenario: Open Google and search for "agavelab"

  Given open "Google" URL
  When I search for "agavelab"
  Then should I see "Agave Lab: Home"

@media=tablet

Scenario: Open Google and search for "testcafe.js"

  Given open "Google" URL
  When I search for "testcafe.js"
  Then should I see "DevExpress"
