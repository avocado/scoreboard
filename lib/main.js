// ==========================================================================
// Project:   bpm_app
// Copyright: ©2011 My Company Inc. All rights reserved.
// ==========================================================================

// TODO: Your app code goes here
spade.require('sproutcore');
//require('sproutcore');
spade.require('sproutcore-datastore');

// Temporary workaround: cast empty strings to null, not 0
// Also: do not allow non-digit characters (prevents NaN errors)
SC.RecordAttribute.registerTransform(Number, {
  /** @private - convert an arbitrary object value to a Number */
  to: function(obj) {
    return (SC.none(obj) || !/^\d+$/.test(obj)) ? null : Number(obj) ;
  }
});


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
  points: function() {
    var points = 0;
    points += this.get('won') * Plan.Match.SCORING['won'];
    points += this.get('draw') * Plan.Match.SCORING['draw'];
    points += this.get('lost') * Plan.Match.SCORING['lost'];
    return points;
  }.property('matches').cacheable()
  
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
        // Search for existing match with same teams
        var q = SC.Query.local(
          Plan.Match, 
          "homeTeam = {t1} AND awayTeam = {t2}", 
          {'t1': team, 't2': other}
        );
        var found = Plan.store.find(q).get('firstObject');
        if (found) return;
        // Create new match if not found
        var m = this.get('store').createRecord(
          Plan.Match, 
          {}, 
          -Math.floor(Math.random() * 99999999));  
        m.set('group', this);
        m.set('homeTeam', team);
        m.set('awayTeam', other);
      }, this);
    }, this);
  },
  standings: function(key, value) {
    var q = SC.Query.local(Plan.Team, {orderBy: 'points DESC, played ASC, won DESC'});
    return Plan.store.find(q);
    
    if (!SC.none(value)) {
      this._standings = value;
    }
    if (SC.none(this._standings)) {
      this._standings = this.get('teams').toArray();
    }
    this._standings.sort(function(a,b){
      return b.get('points') - a.get('points');
    });

    return this._standings;
  }.property('matches').cacheable()
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
  homeScore: SC.Record.attr(Number),
  awayScore: SC.Record.attr(Number),
  isCompleted: function() {
    return !SC.none(this.get('homeScore')) && !SC.none(this.get('awayScore'));
  }.property('homeScore', 'awayScore').cacheable(),
  teams: function() {
    return [this.get('homeTeam'), this.get('awayTeam')];
  }.property('homeTeam', 'awayTeam').cacheable(),
  isDraw: function() {
    return this.get('isCompleted') && this.get('homeScore') === this.get('awayScore');
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

Plan.Match.SCORING = {
  'won': 3,
  'draw': 1,
  'lost': 0
};

Plan.store = SC.Store.create().from(SC.Record.fixtures);
Plan.store.find(Plan.Group).get('firstObject').calcMatches();

Plan.groupsController = SC.ArrayProxy.create({
  content: Plan.store.find(Plan.Group),
  selection: function() {
    return this.content.get('firstObject');
  }.property('content')
});

Plan.groupController = SC.Object.create({
  contentBinding: 'Plan.groupsController.selection'
});

Plan.ScoreField = SC.TextField.extend({
  type: 'text'
});

Plan.standingsController = SC.ArrayController.create({
  contentBinding: 'Plan.groupController.content.standings'
});
