@before=resize
@url=https://e2e-playground.glitch.me/

Feature: E2E Tests

@media=tablet

Scenario: Test playground on desktop-mode

  Given an initial snapshot for "master"
  When I click on @changeTitle
  Then should I take an snapshot for "dev"
