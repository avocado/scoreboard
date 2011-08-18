// ==========================================================================
// Project:   bpm_app
// Copyright: ©2011 My Company Inc. All rights reserved.
// ==========================================================================

// TODO: Your app code goes here
spade.require('sproutcore');
//require('sproutcore');
spade.require('sproutcore-datastore');
var Plan = SC.Application.create();

Plan.Team = SC.Record.extend({
  name: SC.Record.attr(String),
  group: SC.Record.toOne('Plan.Group', {
    isMaster: YES,
    inverse: 'teams'
  })
});

Plan.Team.FIXTURES = [
  { guid: 1,
    name: "Green Avocados",
    group: 1 },
  { guid: 2,
    name: "Red Peppers",
    group: 1 },
  { guid: 3,
    name: "Yellow Pineapples",
    group: 1 },
  { guid: 4,
    name: "Blue Sprouts",
    group: 1}
];

Plan.Group = SC.Record.extend({
  name: SC.Record.attr(String),
  teams: SC.Record.toMany('Plan.Team', {
    isMaster: NO,
    inverse: 'group'
  })
});

Plan.Group.FIXTURES = [
  { guid: 1,
    name: "A",
    teams: [1,2,3,4] }
];

Plan.store = SC.Store.create().from(SC.Record.fixtures);