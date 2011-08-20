# Scoreboard

### Description:

Small SproutCore 2.0 demo app. Makes use of the following features:

  * Including SproutCore with BPM and using `spade.require` to load packages into  application
  * Using `SC.Store` with linked models (Team, Group and Match)
  * Content bindings in views: standings are updated when match results change
  * Using computed properties for each team's won/draw/lost/score statistics

For demo purposes, fixtures are used to create four teams competing in one group. All teams play home and away matches. Matches are auto-generated based on group size. 

For now, all records are set up on app initialization. In a real world app, teams, groups and matches should of course be managed in a separate utility.



Built with [SproutCore 2.0](http://github.com/sproutcore/sproutcore20) (beta.3) and [BPM](http://getbpm.org) 1.0.0.beta.13.

### Install:

  * `git clone` this repository
  * open folder in your web browser (best to use Firefox or Safari for this demo)
  * play around with filling in results for each match and see what happens