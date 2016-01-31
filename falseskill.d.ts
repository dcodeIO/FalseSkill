/**
 * @license FalseSkill (c) 2016 Daniel Wirtz <dcode@dcode.io>
 * Released under the Apache License, Version 2.0
 * @see https://github.com/dcodeIO/FalseSkill for details
 */
declare module FalseSkill {
    export var Tau: number;
    export var InitialRating: number;
    export var InitialDeviation: number;
    export var InitialVolatility: number;
    export const Loss: number;
    export const Draw: number;
    export const Win: number;
    export interface PlayerRating {
        rating: number;
        deviation: number;
        volatility: number;
    }
    export interface OpponentRating {
        rating: number;
        deviation: number;
    }
    /**
     * Creates a new rating object, for a new player.
     */
    export function newRating(player?: PlayerRating): PlayerRating;
    /**
     * Copies a rating object's values to another rating object.
     */
    export function copyRating(from: PlayerRating, to: PlayerRating): PlayerRating;
    /**
     * Converts from Glicko to Glicko-2 scale.
     */
    export function toGlicko2Scale(rating: PlayerRating): PlayerRating;
    /**
     * Converts from Glicko-2 to Glicko scale.
     */
    export function toGlicko1Scale(rating: PlayerRating): PlayerRating;
    /**
     * Calculates a player's new rating once a rating period has concluded.
     */
    export function calculateRating(player: PlayerRating, opponents: OpponentRating[], outcomes: number[]): PlayerRating;
    /**
     * Updates a player's rating in place once a rating period has concluded.
     */
    export function updateRating(player: PlayerRating, opponents: OpponentRating[], outcomes: number[]): void;
    /**
     * Calculates the new rating of a player who has not competed in the rating period.
     */
    export function calculateRatingDidNotCompete(player: PlayerRating): PlayerRating;
    /**
     * Updates the rating of a player, who has not competed in the rating period, in place.
     */
    export function updateRatingDidNotCompete(player: PlayerRating): void;
    export interface Ranking extends Array<PlayerRating> {
    }
    export interface Match {
        player: PlayerRating;
        opponents: OpponentRating[];
        outcomes: number[];
    }
    /**
     * Derives a list of matches from the given rankings in a single multiplayer game.
     * Each ranking, provided in winners to losers order, is an array of players who reached that rank.
     * A filter can be used to only return matches relevant for the specified player.
     */
    export function deriveMatches(rankings: Ranking[], filterBy?: PlayerRating): Match[];
    /**
     * Updates the ratings for each match played, in place.
     */
    export function updateRatings(matches: Match[]): void;
    export interface MatchQuality {
        qualities: number[];
        min: number;
        max: number;
        avg: number;
        med: number;
        str: number;
    }
    /**
     * Calculates the presumed match quality for the specified player in a multiplayer game (2-N players).
     * Returns a structure of numbers in the range of [0.0, 1.0] with 1.0 being the best quality (an expected draw).
     */
    export function calculateMatchQuality(player: PlayerRating, opponents: OpponentRating[]): MatchQuality;
}
declare module 'falseskill.js' {
    export = FalseSkill
}
