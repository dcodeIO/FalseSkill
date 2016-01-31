FalseSkill
==========
A literal implementation of the [Glicko-2](http://www.glicko.net/glicko.html) rating system in TypeScript. Got it?

<p align="center">
    <img src="https://raw.githubusercontent.com/dcodeIO/FalseSkill/master/megarage.png" />
</p>

Usage
-----
The make script generates an AMD module from the TypeScript sources. The npm package ( `npm install falseskill` )
uses amdefine to expose it as a CommonJS module.

* **falseskill.ts** is the commented TypeScript source
* **falseskill.d.ts** is just the TypeScript definition
* **falseskill.js** is the transpiled AMD module
* **falseskill.js.map** is the source map for the former, referencing falseskill.ts
* **falseskill.min.js** is the compressed AMD module
* **falseskill.min.js.map** is the source map for the former, referencing falseskill.ts

API
---

##### Configuration:

```ts
// Defaults
falseskill.Tau = 0.75
falseskill.InitialRating = 1500
falseskill.InitialDeviation = 350
falseskill.InitialVolatility = 0.06
```

##### Create a rating for a new player: 

```ts
falseskill.newRating() : PlayerRating
```

##### Calculate a player's new rating once a rating period has concluded:

```ts
falseskill.calculateRating(player : PlayerRating, opponents : OpponentRating[], outcomes : number[]) : PlayerRating
```

Or update in place:

```ts
falseskill.updateRating(player : PlayerRating, opponents : OpponentRating[], outcomes : number[]) : void
```

##### Calculate the rating of a player who has not competed in the rating period:

```ts
falseskill.calculateRatingDidNotCompete(player : PlayerRating) : PlayerRating
```

Or update in place:

```ts
falseskill.updateRatingDidNotCompete(player : PlayerRating) : void
```

##### Copy an already calculated rating to a player:

```ts
falseskill.copyRating(from : PlayerRating, to : PlayerRating) : PlayerRating
```

##### Derive a set of matches from a multiplayer (3+ players) game:

```ts
falseskill.deriveMatches(rankings : Ranking[], filterBy? : PlayerRating) : Match[]
```

##### Update ratings in place, for a set of matches played:

```ts
falseskill.updateRatings(matches : Match[]) : void
```

##### Calculate the presumed match quality in advance:

```ts
falseskill.calculateMatchQuality(player : PlayerRating, opponents : OpponentRating[]) : MatchQuality
```

Interfaces and constants
------------------------

```ts
falseskill.Loss = 0.0
falseskill.Draw = 0.5
falseskill.Win  = 1.0

interface OpponentRating {
    rating     : number,
    deviation  : number
}

interface PlayerRating extends OpponentRating {
    volatility : number
}

interface Ranking extends Array<PlayerRating> { }

interface Match {
    player    : PlayerRating,
    opponents : OpponentRating[],
    outcomes  : number[]
}

interface MatchQuality {
    qualities : number[],
    min       : number,
    max       : number,
    avg       : number,
    med       : number,
    str       : number
}
```

See [falseskill.ts](blob/master/falseskill.ts) for detailed documentation.

**License:** [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0.html)
