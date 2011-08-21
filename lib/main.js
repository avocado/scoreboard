// ==========================================================================
// Project:   scoreboard
// Copyright: ©2011 Avocado. All rights reserved.
// ==========================================================================

window.spade.require('sproutcore');
window.spade.require('sproutcore-datastore');

// Number transform: make empty strings null, not 0 (thanks, Peter Wagenet!)
// Also: do not allow non-digit characters (prevents nasty NaN errors)
SC.RecordAttribute.registerTransform(Number, {
  /** @private - convert an arbitrary object value to a Number */
  to: function(obj) {
    return (SC.none(obj) || !/^\d+$/.test(obj)) ? null : Number(obj) ;
  }
});

var Score = SC.Application.create();

Score.Team = SC.Record.extend({
  name: SC.Record.attr(String),
  group: SC.Record.toOne('Score.Group', {
    isMaster: YES,
    inverse: 'teams'
  }),
  homeMatches: SC.Record.toMany('Score.Match', {
    isMaster: NO,
    inverse: 'homeTeam'
  }),
  awayMatches: SC.Record.toMany('Score.Match', {
    isMaster: NO,
    inverse: 'awayTeam'
  }),
  matches: function() {
    return this.get('homeMatches').toArray().concat(
      this.get('awayMatches').toArray()
    );
  }.property('homeMatches', 'awayMatches').cacheable(),
  played: function() {
    return this.get('matches').filterProperty('isCompleted').get('length');
  }.property('matches').cacheable(),
  won: function() {
    return this.get('matches').filterProperty('winner', this).get('length');
  }.property('matches').cacheable(),
  draw: function() {
    return this.get('matches').filterProperty('isDraw').get('length');
  }.property('matches').cacheable(),
  lost: function() {
    return this.get('matches').filterProperty('loser', this).get('length');
  }.property('matches').cacheable(),
  goalsFor: function() {
    var ret = 0;
    this.get('matches').forEach(function(item){
      var attr = item.get('homeTeam') === this ? 'homeScore' : 'awayScore';
      ret += item.get(attr);
    }, this);
    return ret;
  }.property('matches').cacheable(),
  goalsAgainst: function() {
    var ret = 0;
    this.get('matches').forEach(function(item){
      var attr = item.get('homeTeam') === this ? 'awayScore' : 'homeScore';
      ret += item.get(attr);
    }, this);
    return ret;
  }.property('matches').cacheable(),
  goalDifference: function() {
    return this.get('goalsFor') - this.get('goalsAgainst');
  }.property('goalsFor', 'goalsAgainst').cacheable(),
  points: function() {
    var points = 0;
    'won draw lost'.w().forEach(function(result) {
      points += this.get(result) * Score.Match.POINTS_AWARDED[result];
    }, this);
    return points;
  }.property('matches').cacheable()
  
});

Score.Group = SC.Record.extend({
  name: SC.Record.attr(String),
  teams: SC.Record.toMany('Score.Team', {
    isMaster: NO,
    inverse: 'group'
  }),
  matches: SC.Record.toMany('Score.Match', {
    isMaster: NO,
    inverse: 'group'
  }),
  standings: function(key, value) {
    var q = SC.Query.local(
      Score.Team, 
      {orderBy: 'points DESC, played ASC, goalDifference DESC, goalsFor DESC'}
    );
    return Score.store.find(q);
  }.property('matches').cacheable(),
  calcMatches: function() {
    this.get('teams').forEach(function(team, index, all) {
      // Create array with other teams
      var others = all.filter(function(t2){
        return t2 !== team;
      });
      others.forEach(function(other){
        // Search for existing match with same teams
        var q = SC.Query.local(
          Score.Match, 
          "homeTeam = {t1} AND awayTeam = {t2}", 
          {'t1': team, 't2': other}
        );
        var found = Score.store.find(q).get('firstObject');
        if (found) return;
        // Create new match if not found
        var match = this.get('store').createRecord(
          Score.Match, {}, -Math.floor(Math.random() * 99999999)
        );
        match.set('group', this);
        match.set('homeTeam', team);
        match.set('awayTeam', other);
      }, this);
    }, this);
  }
});

Score.Match = SC.Record.extend({
  group: SC.Record.toOne('Score.Group', {
    isMaster: YES,
    inverse: 'matches'
  }),
  homeTeam: SC.Record.toOne('Score.Team', {
    isMaster: YES,
    inverse: 'homeMatches'
  }),
  awayTeam: SC.Record.toOne('Score.Team', {
    isMaster: YES,
    inverse: 'awayMatches'
  }),
  homeScore: SC.Record.attr(Number),
  awayScore: SC.Record.attr(Number),
  isCompleted: function() {
    return !SC.none(this.get('homeScore')) && !SC.none(this.get('awayScore'));
  }.property('homeScore', 'awayScore').cacheable(),
  teams: function() {
    return [this.get('homeTeam'), this.get('awayTeam')];
  }.property('homeTeam', 'awayTeam').cacheable(),
  isDraw: function() {
    if (!this.get('isCompleted')) return null;
    return this.get('homeScore') === this.get('awayScore');
  }.property('homeScore', 'awayScore').cacheable(),
  winner: function() {
    if (this.get('isDraw') || !this.get('isCompleted')) return null;
    if (this.get('homeScore') > this.get('awayScore')) {
      return this.get('homeTeam');
    }
    return this.get('awayTeam');
  }.property('homeScore', 'awayScore').cacheable(),
  loser: function() {
    if (this.get('isDraw') || !this.get('isCompleted')) return null;
    if (this.get('homeScore') > this.get('awayScore')) {
      return this.get('awayTeam');
    }
    return this.get('homeTeam');
  }.property('homeScore', 'awayScore').cacheable(),
  scoreDidChange: function() {
    this.get('homeTeam').notifyPropertyChange('homeMatches');
    this.get('awayTeam').notifyPropertyChange('awayMatches');
    this.get('group').notifyPropertyChange('matches');
  }.observes('homeScore', 'awayScore')
});

Score.Match.POINTS_AWARDED = {
  'won': 3,
  'draw': 1,
  'lost': 0
};

Score.Team.FIXTURES = [
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
Score.Group.FIXTURES = [
  { guid: 1,
    name: "A",
    teams: [1,2,3,4] }
];

// For demo purposes: use fixtures and calculate matches once on startup
Score.store = SC.Store.create().from(SC.Record.fixtures);
Score.store.find(Score.Group).get('firstObject').calcMatches();

// groupsController doesn't do anything in this demo (there's just one group)
// In real world app, should present a list of groups to select one from
Score.groupsController = SC.ArrayProxy.create({
  content: Score.store.find(Score.Group),
  selection: function() {
    return this.content.get('firstObject');
  }.property('content').cacheable()
});
Score.groupController = SC.Object.create({
  contentBinding: 'Score.groupsController.selection'
});
Score.standingsController = SC.ArrayController.create({
  contentBinding: 'Score.groupController.content.standings'
});
