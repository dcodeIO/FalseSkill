declare module falseskill {
        
    export const Tau;

    export const InitialRating;
    export const InitialDeviation;
    export const InitialVolatility;

    export const Loss;
    export const Draw;
    export const Win;
    
    export function newRating() : PlayerRating;
    
    export function calculateRating(player : PlayerRating, opponents : OpponentRating[], outcomes : number[]) : PlayerRating 
    
    export interface OpponentRating {
        rating     : number,
        deviation  : number
    }

    export interface PlayerRating extends OpponentRating {
        volatility : number
    }

    export function newRating() : PlayerRating;
    
    export function calculateRatingDidNotCompete(player : PlayerRating) : PlayerRating;
    
    export function copyRating(from : PlayerRating, to : PlayerRating) : PlayerRating;
    
    export function updateRating(player : PlayerRating, opponents : OpponentRating[], outcomes : number[]) : void;
    
    export function updateRatingDidNotCompete(player : PlayerRating) : void;
    
    export interface Ranking extends Array<PlayerRating> { }
    
    export interface Match {
        player    : PlayerRating,
        opponents : OpponentRating[],
        outcomes  : number[]
    }
    
    export function deriveMatches(rankings : Ranking[], filterBy? : PlayerRating) : Match[];
    
    export function updateRatings(matches : Match[]) : void;
    
    export function toGlicko2Scale(rating : PlayerRating) : PlayerRating;
    
    export function toGlicko1Scale(rating : PlayerRating) : PlayerRating;
    
    export interface MatchQuality {
        qualities : number[],
        min       : number,
        max       : number,
        avg       : number,
        med       : number,
        str       : number
    }
    
    export function calculateMatchQuality(player : PlayerRating, opponents : OpponentRating[]) : MatchQuality;
    
}

declare module 'falseskill.js' {
    export = falseskill
}
