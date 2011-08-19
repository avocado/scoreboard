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
  }),
  homeMatches: SC.Record.toMany('Plan.Match', {
    isMaster: NO,
    inverse: 'homeTeam'
  }),
  awayMatches: SC.Record.toMany('Plan.Match', {
    isMaster: NO,
    inverse: 'awayTeam'
  }),
  matches: function() {
    return this.get('homeMatches').toArray().concat(this.get('awayMatches').toArray());
  }.property('homeMatches', 'awayMatches'),
  score: function() {
    var score = 0;
    score += this.get('won') * Plan.Match.SCORING['won'];
    score += this.get('draw') * Plan.Match.SCORING['draw'];
    score += this.get('lost') * Plan.Match.SCORING['lost'];
    return score;
  }.property('homeMatches', 'awayMatches').cacheable(),
  completed: function() {
    return this.get('matches').filterProperty('completed').get('length');
  }.property('homeMatches', 'awayMatches').cacheable(),
  won: function() {
    return this.get('matches').filterProperty('winner', this).get('length');
  }.property('homeMatches', 'awayMatches').cacheable(),
  lost: function() {
    return this.get('matches').filterProperty('loser', this).get('length');
  }.property('homeMatches', 'awayMatches').cacheable(),
  draw: function() {
    return this.get('matches').filterProperty('isDraw').get('length');
  }.property('homeMatches', 'awayMatches').cacheable()
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
    group: 1 }
];

Plan.Group = SC.Record.extend({
  name: SC.Record.attr(String),
  teams: SC.Record.toMany('Plan.Team', {
    isMaster: NO,
    inverse: 'group'
  }),
  matches: SC.Record.toMany('Plan.Match', {
    isMaster: NO,
    inverse: 'group'
  }),
  calcMatches: function() {
    this.get('teams').forEach(function(team, index, all){
      // Create array with other teams
      var others = all.filter(function(t2){
        return t2 !== team;
      });
      
      others.forEach(function(other){
        // Search for existing matches with same teams
        var q = SC.Query.local(
          Plan.Match, 
          "homeTeam = {t1} AND awayTeam = {t2}", 
          {'t1': team, 't2': other}
        );
        var found = Plan.store.find(q).get('firstObject');
        if (found) {
          return;
        }
        // Create new match if not found
        var m = this.get('store').createRecord(
          Plan.Match, 
          {}, 
          -Math.random(Math.floor(Math.random() * 99999999)));  
        m.set('group', this);
        m.set('homeTeam', team);
        m.set('awayTeam', other);
      }, this);
      
      //console.log(others);
    }, this);
    //console.log(teams);
  }
});

Plan.Group.FIXTURES = [
  { guid: 1,
    name: "A",
    teams: [1,2,3,4] }
];

Plan.Match = SC.Record.extend({
  group: SC.Record.toOne('Plan.Group', {
    isMaster: YES,
    inverse: 'matches'
  }),
  homeTeam: SC.Record.toOne('Plan.Team', {
    isMaster: YES,
    inverse: 'homeMatches'
  }),
  awayTeam: SC.Record.toOne('Plan.Team', {
    isMaster: YES,
    inverse: 'awayMatches'
  }),
  homeScore: SC.Record.attr(Number, {defaultValue: 0}),
  awayScore: SC.Record.attr(Number, {defaultValue: 0}),
  completed: SC.Record.attr(Boolean, {defaultValue: false}),
  teams: function() {
    return [this.get('homeTeam'), this.get('awayTeam')];
  }.property('homeTeam', 'awayTeam').cacheable(),
  scoreDidChange: function() {
    this.get('homeTeam').notifyPropertyChange('homeMatches');
    this.get('awayTeam').notifyPropertyChange('awayMatches');
  }.observes('homeScore', 'awayScore', 'completed'),
  isDraw: function() {
    return this.get('completed') && this.get('homeScore') === this.get('awayScore');
  }.property('homeScore', 'awayScore', 'completed').cacheable(),
  winner: function() {
    if (this.get('isDraw') || !this.get('completed')) return null;
    if (this.get('homeScore') > this.get('awayScore')) {
      return this.get('homeTeam');
    }
    return this.get('awayTeam');
  }.property('homeScore', 'awayScore', 'completed').cacheable(),
  loser: function() {
    if (this.get('isDraw') || !this.get('completed')) return null;
    if (this.get('homeScore') > this.get('awayScore')) {
      return this.get('awayTeam');
    }
    return this.get('homeTeam');
  }.property('homeScore', 'awayScore', 'completed').cacheable()
});

Plan.Match.SCORING = {
  'won': 3,
  'draw': 1,
  'lost': 0
};

Plan.store = SC.Store.create().from(SC.Record.fixtures);

Plan.groupsController = SC.ArrayProxy.create({
  content: Plan.store.find(Plan.Group)
});

Plan.groupsController.get('firstObject').calcMatches();

Plan.ScoreField = SC.TextField.extend({
  type: 'number',
  keyUp: function(event) {
    this._super(event);
    
  }
});
