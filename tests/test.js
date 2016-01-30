var falseskill = require('../index.js'),
    assert = require('assert')

// example taken from http://www.glicko.net/glicko/glicko2.pdf

var players = [
    {
        id: 'Player1',
        rating: 1500,
        deviation: 200,
        volatility: 0.06
    },
    {
        id: 'Player2',
        rating: 1400,
        deviation: 30,
        volatility: 0.06
    }, 
    {
        id: 'Player3',
        rating: 1550,
        deviation: 100,
        volatility: 0.06
    }, {
        id: 'Player4',
        rating: 1700,
        deviation: 300,
        volatility: 0.06
    }
]

var outcomes = [
    falseskill.Win,
    falseskill.Loss,
    falseskill.Loss
]

var newRating = falseskill.calculateRating(players[0], players.slice(1), outcomes)

// this is actually not exactly what's in the example, which was done by hand:

assert.strictEqual(newRating.rating.toFixed(5), '1464.05067')   // 1464.06
assert.strictEqual(newRating.deviation.toFixed(5), '151.51652') // 151.52
assert.strictEqual(newRating.volatility.toFixed(5), '0.06000')  // 0.05999

console.log('OK')
