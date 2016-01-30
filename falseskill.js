/**
 * @license FalseSkill (c) 2016 Daniel Wirtz <dcode@dcode.io>
 * Released under the Apache License, Version 2.0
 * @see https://github.com/dcodeIO/FalseSkill for details
 */
define(["require", "exports"], function (require, exports) {
    // ref: http://www.glicko.net/glicko/glicko2.pdf
    // The system constant, τ , which constrains the change in volatility over time, needs to be
    // set prior to application of the system. Reasonable choices are between 0.3 and 1.2,
    // though the system should be tested to decide which value results in greatest predictive
    // accuracy. Smaller values of τ prevent the volatility measures from changing by large
    // amounts, which in turn prevent enormous changes in ratings based on very improbable
    // results. If the application of Glicko-2 is expected to involve extremely improbable
    // collections of game outcomes, then τ should be set to a small value, even as small as,
    // say, τ = 0.2.
    exports.Tau = 0.75;
    // If the player is unrated, set the rating to 1500 and the RD to 350. Set the player’s
    // volatility to 0.06 (this value depends on the particular application).
    exports.InitialRating = 1500;
    exports.InitialDeviation = 350;
    exports.InitialVolatility = 0.06;
    // 0 for a loss, 0.5 for a draw, and 1 for a win
    exports.Loss = 0.0;
    exports.Draw = 0.5;
    exports.Win = 1.0;
    /**
     * Creates a new rating object, for a new player.
     */
    function newRating() {
        return {
            rating: exports.InitialRating,
            deviation: exports.InitialDeviation,
            volatility: exports.InitialVolatility
        };
    }
    exports.newRating = newRating;
    var PiSq = Math.PI * Math.PI;
    var TauSq = exports.Tau * exports.Tau;
    /**
     * Calculates a player's new rating once a rating period has concluded.
     */
    function calculateRating(player, opponents, outcomes) {
        if (opponents.length !== outcomes.length)
            throw Error('number of opponents is different than number of outcomes');
        if (opponents.length === 0)
            return calculateRatingDidNotCompete(player);
        // Step 2: For each player, convert the ratings and RD’s onto the Glicko-2 scale
        player = toGlicko2Scale(player);
        opponents = opponents.map(toGlicko2Scale);
        // Step 3: Compute the quantity v. This is the estimated variance of the team’s/player’s
        //         rating based only on game outcomes
        function g(deviation) {
            return 1.0 / (Math.sqrt(1.0 + 3.0 * Math_sq(deviation) / PiSq));
        }
        function E(rating, opponentRating, opponentDeviation) {
            return 1.0 / (1.0 + Math.exp(-g(opponentDeviation) * (rating - opponentRating)));
        }
        var v = 0;
        opponents.forEach(function (opponent) {
            var e = E(player.rating, opponent.rating, opponent.deviation);
            v += Math_sq(g(opponent.deviation)) * e * (1.0 - e);
        });
        v = 1.0 / v;
        // Step 4: Compute the quantity ∆, the estimated improvement in rating by comparing the
        //         pre-period rating to the performance rating based only on game outcomes
        var DSum = 0;
        opponents.forEach(function (opponent, index) {
            DSum += g(opponent.deviation) * (outcomes[index] - E(player.rating, opponent.rating, opponent.deviation));
        });
        var D = v * DSum;
        // Step 5: Determine the new value, σ, of the volatility
        var a = Math.log(Math_sq(player.volatility));
        var deviationSq = Math_sq(player.deviation);
        function f(x) {
            var ePowX = Math.pow(Math.E, x);
            return (ePowX * (Math_sq(D) - deviationSq - v - ePowX)) / Math_sq(2.0 * (deviationSq + v + ePowX))
                - (x - a) / TauSq;
        }
        var A = a;
        var DSq = Math_sq(D);
        var deviationSq = Math_sq(player.deviation);
        var B = 0.0;
        if (DSq > deviationSq + v) {
            B = Math.log(DSq - deviationSq - v);
        }
        else {
            var k = 1;
            while (f(a - k * exports.Tau) < 0.0)
                k = k + 1;
            B = a - k * exports.Tau;
        }
        var fA = f(A), fB = f(B);
        while (Math.abs(B - A) > 0.000001) {
            var C = A + (A - B) * fA / (fB - fA);
            var fC = f(C);
            if (fC * fB < 0.0) {
                A = B;
                fA = fB;
            }
            else {
                fA = fA / 2.0;
            }
            B = C;
            fB = fC;
        }
        var newVolatility = Math.pow(Math.E, A / 2.0);
        // Step 6: Update the rating deviation to the new pre-rating period value, φ*
        var preRatingDeviation = Math.sqrt(deviationSq + Math_sq(newVolatility));
        // Step 7: Update the rating and RD to the new values, µ' and φ'
        var newDeviation = 1.0 / Math.sqrt(1.0 / Math_sq(preRatingDeviation) + 1.0 / v);
        var newRating = player.rating + Math_sq(newDeviation) * DSum;
        // Step 8: Convert ratings and RD’s back to original scale:
        return toGlicko1Scale({
            rating: newRating,
            deviation: newDeviation,
            volatility: newVolatility
        });
    }
    exports.calculateRating = calculateRating;
    /**
     * Calculates the new rating of a player who has not competed in the rating period.
     */
    function calculateRatingDidNotCompete(player) {
        // Note that if a player does not compete during the rating period, then only Step 6 applies. In
        // this case, the player’s rating and volatility parameters remain the same, but the RD increases
        player = toGlicko2Scale(player);
        player.deviation = Math.sqrt(Math_sq(player.deviation) + Math_sq(player.volatility));
        return toGlicko1Scale(player);
    }
    exports.calculateRatingDidNotCompete = calculateRatingDidNotCompete;
    /**
     * Copies a rating object's values to another rating object.
     */
    function copyRating(from, to) {
        to.rating = from.rating;
        to.deviation = from.deviation;
        to.volatility = from.volatility;
        return to;
    }
    exports.copyRating = copyRating;
    /**
     * Updates a player's rating in place once a rating period has concluded.
     */
    function updateRating(player, opponents, outcomes) {
        copyRating(calculateRating(player, opponents, outcomes), player);
    }
    exports.updateRating = updateRating;
    /**
     * Updates the rating of a player, who has not competed in the rating period, in place.
     */
    function updateRatingDidNotCompete(player) {
        copyRating(calculateRatingDidNotCompete(player), player);
    }
    exports.updateRatingDidNotCompete = updateRatingDidNotCompete;
    /**
     * Derives a list of matches from the given rankings in a single multiplayer game.
     * Each ranking, provided in winners to losers order, is an array of players who reached that rank.
     * A filter can be used to only return matches relevant for the specified player.
     */
    function deriveMatches(rankings, filterBy) {
        // [
        //  [p1] rank 1,
        //  [p2, p3] rank 2 (draw between p2 and p3),
        //  [p4] rank 3
        // ]
        var indexedPlayers = [], playersAlreadyIndexed = [], filteredPlayer = null;
        rankings.forEach(function (players, rank) {
            players.forEach(function (player) {
                if (playersAlreadyIndexed.indexOf(player) >= 0)
                    throw Error('players cannot reach multiple ranks at once');
                var indexedPlayer = {
                    rank: rank,
                    player: player
                };
                indexedPlayers.push(indexedPlayer);
                playersAlreadyIndexed.push(player);
                if (filterBy && player === filterBy)
                    filteredPlayer = indexedPlayer;
            });
        });
        if (filterBy && !filteredPlayer)
            throw Error('there is no player matching the provided filter');
        var matches = [];
        (filterBy ? [filteredPlayer] : indexedPlayers).forEach(function (indexedPlayer) {
            var opponents = [], outcomes = [];
            indexedPlayers.forEach(function (indexedOpponent) {
                if (indexedPlayer === indexedOpponent)
                    return;
                opponents.push(indexedOpponent.player);
                if (indexedPlayer.rank < indexedOpponent.rank)
                    outcomes.push(exports.Win);
                else if (indexedPlayer.rank > indexedOpponent.rank)
                    outcomes.push(exports.Loss);
                else
                    outcomes.push(exports.Draw);
            });
            matches.push({
                player: indexedPlayer.player,
                opponents: opponents,
                outcomes: outcomes
            });
        });
        return matches;
    }
    exports.deriveMatches = deriveMatches;
    /**
     * Updates the ratings for each match played, in place.
     */
    function updateRatings(matches) {
        matches.forEach(function (match) {
            updateRating(match.player, match.opponents, match.outcomes);
        });
    }
    exports.updateRatings = updateRatings;
    function calculateMatchQualityG1(player, opponent) {
        // ref: https://github.com/McLeopold/PythonSkills/blob/master/skills/glicko.py#L186
        // This is actually for Glicko, not Glicko-2, but that's all we have without thinking ourselves.
        var expectedScore = 1.0 / (1.0 + Math.pow(10.0, (opponent.rating - player.rating) / (2.0 * exports.InitialDeviation)));
        return (0.5 - Math.abs(expectedScore - 0.5)) / 0.5;
    }
    /**
     * Calculates the presumed match quality for the specified player.
     * Returns a structure of numbers in the range of [0.0, 1.0] with 1.0 being the best quality (a draw).
     */
    function calculateMatchQuality(player, opponents) {
        var qualities = [], min = 1.0, max = 0.0, sum = 0.0;
        var strongestOpponent = null, strongest = 0.0;
        opponents.forEach(function (opponent) {
            var quality = calculateMatchQualityG1(player, opponent);
            if (quality < min)
                min = quality;
            if (quality > max)
                max = quality;
            sum += quality;
            qualities.push(quality);
            if (!strongestOpponent || opponent.rating > strongestOpponent.rating) {
                strongestOpponent = opponent;
                strongest = quality;
            }
        });
        var sortedQualities = qualities.slice();
        sortedQualities.sort();
        var half = (sortedQualities.length / 2) | 0, median = sortedQualities.length & 1 ? sortedQualities[half] : (sortedQualities[half - 1] + sortedQualities[half]) / 2.0;
        return {
            qualities: qualities,
            min: min,
            max: max,
            avg: sum / opponents.length,
            med: median,
            str: strongest
        };
    }
    exports.calculateMatchQuality = calculateMatchQuality;
    // ---- Utility -----
    function toGlicko2Scale(rating) {
        // µ = (r − 1500)/173.7178, φ = RD/173.7178
        return {
            rating: (rating.rating - 1500.0) / 173.7178,
            deviation: rating.deviation / 173.7178,
            volatility: rating.volatility
        };
    }
    exports.toGlicko2Scale = toGlicko2Scale;
    function toGlicko1Scale(rating) {
        // r' = 173.7178µ + 1500, RD' = 173.7178φ²
        return {
            rating: 173.7178 * rating.rating + 1500.0,
            deviation: 173.7178 * rating.deviation,
            volatility: rating.volatility
        };
    }
    exports.toGlicko1Scale = toGlicko1Scale;
    function Math_sq(x) {
        return x * x;
    }
});
//# sourceMappingURL=falseskill.js.map