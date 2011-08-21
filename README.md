# Scoreboard

## Description:

Small SproutCore 2.0 demo app for managing competition results and standings.

Makes use of the following features:

  * Basic BPM app setup with packages `sproutcore` and `sproutcore-datastore`
  * Using `spade.require` to use packages in application
  * Using `SC.Store` with linked models (Team, Group and Match)
  * Content bindings in views: standings are updated when match results change
  * Using computed properties for each team's won/draw/lost/score statistics

Fixtures are used to create four teams competing in one group. All teams play home and away matches. Matches are auto-generated based on group size. 

For now, all records are set up on app initialization. In a real world app, teams, groups and matches should of course be managed in a separate utility.

Built with [SproutCore 2.0](http://github.com/sproutcore/sproutcore20) (2.0.beta.3), [sproutcore-datastore](http://github.com/sproutcore/sproutcore-datastore) 2.0.beta.2 and [BPM](http://github.com/bpm/bpm) 1.0.0.beta.13.

## Basic usage:

  * `git clone` this repository
  * open `index.html` in your web browser (best to use Firefox or Safari for this demo)
  * play around with filling in results for each match and see what happens
  
## Main application files:

  * `assets/*`: BPM-generated JavaScript and CSS files
  * `lib/main.js`: application code
  * `css/main.css`: application stylesheet
  * `index.html`: Handlebars templates
  
The code in `main.js` isn't fully annotated, but hopefully speaks for itself. Most of the action happens in the model definitions: `Score.Team`, `Score.Group` and `Score.Match`.

## Known issues:

  * The current `<div>` and `<span>` layouts for Standings and Matches are workarounds. They should have been `<table>` elements, but I ran into layout problems, possibly because of SproutCore adding extra wrapper containers to the HTML tree.
  * Only tested in Firefox 6.0 and Safari 5.1. Not guaranteed to work in other browsers.
    