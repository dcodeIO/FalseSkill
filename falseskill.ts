/**
 * @license FalseSkill (c) 2016 Daniel Wirtz <dcode@dcode.io>
 * Released under the Apache License, Version 2.0
 * @see https://github.com/dcodeIO/FalseSkill for details
 */

// ref: http://www.glicko.net/glicko/glicko2.pdf

// The system constant, τ , which constrains the change in volatility over time, needs to be
// set prior to application of the system. Reasonable choices are between 0.3 and 1.2,
// though the system should be tested to decide which value results in greatest predictive
// accuracy. Smaller values of τ prevent the volatility measures from changing by large
// amounts, which in turn prevent enormous changes in ratings based on very improbable
// results. If the application of Glicko-2 is expected to involve extremely improbable
// collections of game outcomes, then τ should be set to a small value, even as small as,
// say, τ = 0.2.
export var Tau = 0.75

// If the player is unrated, set the rating to 1500 and the RD to 350. Set the player’s
// volatility to 0.06 (this value depends on the particular application).
export var InitialRating     = 1500
export var InitialDeviation  = 350
export var InitialVolatility = 0.06

// 0 for a loss, 0.5 for a draw, and 1 for a win
export const Loss = 0.0
export const Draw = 0.5
export const Win  = 1.0

// The opponents’ volatilities are not relevant in the calculations.
export interface OpponentRating {
    rating     : number, // µ
    deviation  : number  // φ
}

// We now want to update the rating of a player with (Glicko-2) rating µ, rating deviation
// φ, and volatility σ
export interface PlayerRating extends OpponentRating {
    volatility : number  // σ
}

/**
 * Creates a new rating object, for a new player.
 */
export function newRating() : PlayerRating {
    return {
        rating: InitialRating,
        deviation: InitialDeviation,
        volatility: InitialVolatility
    }
}

const PiSq = Math.PI * Math.PI

/**
 * Calculates a player's new rating once a rating period has concluded.
 */
export function calculateRating(player : PlayerRating, opponents : OpponentRating[], outcomes : number[]) : PlayerRating {
    if (opponents.length !== outcomes.length)
        throw Error('number of opponents is different than number of outcomes')
        
    if (opponents.length === 0)
        return calculateRatingDidNotCompete(player)

    // Step 2: For each player, convert the ratings and RD’s onto the Glicko-2 scale
    player = toGlicko2Scale(player)
    opponents = opponents.map(toGlicko2Scale)
    
    // Step 3: Compute the quantity v. This is the estimated variance of the team’s/player’s
    //         rating based only on game outcomes
    function g(deviation) {
        return 1.0 / (Math.sqrt(1.0 + 3.0 * Math_sq(deviation) / PiSq))
    }
    function E(rating, opponentRating, opponentDeviation) {
        return 1.0 / (1.0 + Math.exp(-g(opponentDeviation) * (rating - opponentRating)))
    }
    var v = 0
    opponents.forEach(opponent => {
        var e = E(player.rating, opponent.rating, opponent.deviation)
        v += Math_sq(g(opponent.deviation)) * e * (1.0 - e)
    })
    v = 1.0 / v
    
    // Step 4: Compute the quantity ∆, the estimated improvement in rating by comparing the
    //         pre-period rating to the performance rating based only on game outcomes
    var DSum = 0
    opponents.forEach((opponent, index) => {
        DSum += g(opponent.deviation) * (outcomes[index] - E(player.rating, opponent.rating, opponent.deviation))
    })
    var D = v * DSum
    
    // Step 5: Determine the new value, σ, of the volatility
    var a = Math.log(Math_sq(player.volatility))
    var deviationSq = Math_sq(player.deviation)
    const TauSq = Tau * Tau
    function f(x) {
        var ePowX = Math.pow(Math.E, x)
        return (ePowX * (Math_sq(D) - deviationSq - v - ePowX)) / Math_sq(2.0 * (deviationSq + v + ePowX))
             - (x - a) / TauSq
    }
    var A = a
    var DSq = Math_sq(D)
    var deviationSq = Math_sq(player.deviation)
    var B = 0.0
    if (DSq > deviationSq + v) {
        B = Math.log(DSq - deviationSq - v)
    } else {
        let k = 1
        while (f(a - k * Tau) < 0.0)
            k = k + 1
        B = a - k * Tau
    }
    var fA = f(A),
        fB = f(B)
    while (Math.abs(B - A) > 0.000001) {
        let C = A + (A - B) * fA / (fB - fA)
        let fC = f(C)
        if (fC * fB < 0.0) {
            A = B
            fA = fB
        } else {
            fA = fA / 2.0
        }
        B = C
        fB = fC
    }
    var newVolatility = Math.pow(Math.E, A / 2.0)
    
    // Step 6: Update the rating deviation to the new pre-rating period value, φ*
    var preRatingDeviation = Math.sqrt(deviationSq + Math_sq(newVolatility))
    
    // Step 7: Update the rating and RD to the new values, µ' and φ'
    var newDeviation = 1.0 / Math.sqrt(1.0 / Math_sq(preRatingDeviation) + 1.0 / v)
    var newRating = player.rating + Math_sq(newDeviation) * DSum
    
    // Step 8: Convert ratings and RD’s back to original scale:
    return toGlicko1Scale({
        rating: newRating,
        deviation: newDeviation,
        volatility: newVolatility
    })
}

/**
 * Calculates the new rating of a player who has not competed in the rating period.
 */
export function calculateRatingDidNotCompete(player : PlayerRating) : PlayerRating {
    // Note that if a player does not compete during the rating period, then only Step 6 applies. In
    // this case, the player’s rating and volatility parameters remain the same, but the RD increases
    player = toGlicko2Scale(player)
    player.deviation = Math.sqrt(Math_sq(player.deviation) + Math_sq(player.volatility))
    return toGlicko1Scale(player)
}

/**
 * Copies a rating object's values to another rating object.
 */
export function copyRating(from : PlayerRating, to : PlayerRating) : PlayerRating {
    to.rating = from.rating
    to.deviation = from.deviation
    to.volatility = from.volatility
    return to
}

/**
 * Updates a player's rating in place once a rating period has concluded.
 */
export function updateRating(player : PlayerRating, opponents : OpponentRating[], outcomes : number[]) : void {
    copyRating(calculateRating(player, opponents, outcomes), player)
}

/**
 * Updates the rating of a player, who has not competed in the rating period, in place.
 */
export function updateRatingDidNotCompete(player : PlayerRating) : void {
    copyRating(calculateRatingDidNotCompete(player), player)
}

// Matches with more than two competitors, computed as a tournament in which each player
// competed against all the other players.

// Multiple players may reach the same ranking, which is then considered a draw between them.
export interface Ranking extends Array<PlayerRating> { }

// A match simply represents the inputs to calculateRating(), for a single player.
export interface Match {
    player    : PlayerRating,
    opponents : OpponentRating[],
    outcomes  : number[]
}

/**
 * Derives a list of matches from the given rankings in a single multiplayer game.
 * Each ranking, provided in winners to losers order, is an array of players who reached that rank.
 * A filter can be used to only return matches relevant for the specified player.
 */
export function deriveMatches(rankings : Ranking[], filterBy? : PlayerRating) : Match[] {   
    // [
    //  [p1] rank 1,
    //  [p2, p3] rank 2 (draw between p2 and p3),
    //  [p4] rank 3
    // ]
    
    interface IndexedPlayer { rank: number, player : PlayerRating }
    
    var indexedPlayers : IndexedPlayer[] = [],
        playersAlreadyIndexed : PlayerRating[] = [],
        filteredPlayer : IndexedPlayer = null
    rankings.forEach((players, rank) => {
        players.forEach(player => {
            if (playersAlreadyIndexed.indexOf(player) >= 0)
                throw Error('players cannot reach multiple ranks at once')
            var indexedPlayer = {
                rank: rank,
                player: player
            }
            indexedPlayers.push(indexedPlayer)
            playersAlreadyIndexed.push(player)
            if (filterBy && player === filterBy)
                filteredPlayer = indexedPlayer
        })
    })
    if (filterBy && !filteredPlayer)
        throw Error('there is no player matching the provided filter')
    var matches : Match[] = [];
    (filterBy ? [ filteredPlayer ] : indexedPlayers).forEach(indexedPlayer => {
        var opponents = [],
            outcomes = []
        indexedPlayers.forEach(indexedOpponent => {
            if (indexedPlayer === indexedOpponent)
                return
            opponents.push(indexedOpponent.player)
            if (indexedPlayer.rank < indexedOpponent.rank)
                outcomes.push(Win)
            else if (indexedPlayer.rank > indexedOpponent.rank)
                outcomes.push(Loss)
            else
                outcomes.push(Draw)
        })
        matches.push({
            player: indexedPlayer.player,
            opponents: opponents,
            outcomes: outcomes
        })
    })
    return matches
}

/**
 * Updates the ratings for each match played, in place.
 */
export function updateRatings(matches : Match[]) : void {
    matches.forEach(match => {
        updateRating(match.player, match.opponents, match.outcomes)
    })
}

export interface MatchQuality {
    qualities : number[], // qualities for each opponent
    min       : number,   // minimum quality
    max       : number,   // maximum quality
    avg       : number,   // average quality
    med       : number,   // median quality
    str       : number    // highest rating opponent only
}

function calculateMatchQualityG1(player : PlayerRating, opponent : OpponentRating) : number {
    // ref: https://github.com/McLeopold/PythonSkills/blob/master/skills/glicko.py#L186
    // This is actually for Glicko, not Glicko-2, but that's all we have without thinking ourselves.
    var expectedScore = 1.0 / (1.0 + Math.pow(10.0, (opponent.rating - player.rating) / (2.0 * InitialDeviation)))
    return (0.5 - Math.abs(expectedScore - 0.5)) / 0.5
}

/**
 * Calculates the presumed match quality for the specified player.
 * Returns a structure of numbers in the range of [0.0, 1.0] with 1.0 being the best quality (a draw).
 */
export function calculateMatchQuality(player : PlayerRating, opponents : OpponentRating[]) : MatchQuality {
    var qualities = [],
        min = 1.0,
        max = 0.0,
        sum = 0.0
    var strongestOpponent = null,
        strongest = 0.0
    opponents.forEach(opponent => {
        var quality = calculateMatchQualityG1(player, opponent)
        if (quality < min)
            min = quality
        if (quality > max)
            max = quality
        sum += quality
        qualities.push(quality)
        if (!strongestOpponent || opponent.rating > strongestOpponent.rating) {
            strongestOpponent = opponent
            strongest = quality
        }
    })
    var sortedQualities = qualities.slice()
        sortedQualities.sort()
    var half = (sortedQualities.length / 2) | 0,
        median = sortedQualities.length & 1 ? sortedQualities[half] : (sortedQualities[half - 1] + sortedQualities[half]) / 2.0
    return {
        qualities : qualities,
        min: min,
        max: max,
        avg: sum / opponents.length,
        med: median,
        str: strongest
    }
}

// ---- Utility -----

export function toGlicko2Scale(rating : PlayerRating) : PlayerRating {
    // µ = (r − 1500)/173.7178, φ = RD/173.7178
    return {
        rating: (rating.rating - 1500.0) / 173.7178,
        deviation: rating.deviation / 173.7178,
        volatility: rating.volatility
    }
}

export function toGlicko1Scale(rating : PlayerRating) : PlayerRating {
    // r' = 173.7178µ' + 1500, RD' = 173.7178φ'
    return {
        rating: 173.7178 * rating.rating + 1500.0,
        deviation: 173.7178 * rating.deviation,
        volatility: rating.volatility
    }
}

function Math_sq(x : number) : number {
    return x * x
}
