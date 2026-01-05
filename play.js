"use strict";

const cheatBetterCards = true;
const cheatStupidOpponents = true;
const playIdleVideos = true;

function debug(id, text) {
    console.log(`[${id}] ${text}`)
}

function error(id, text) {
    console.log(`ERROR [${id}] ${text}`)
}

const State ={
    Start: 1,
    Init: 2,
    Intro: 3,
    Deal: 4,
    BetFirst: 5,
    Bet: 6,
    Call: 7,
    Fold: 8,
    Done: 9,
    Broke: 10,
    GameDone: 11
}

//**************************************************************************************************************************************** Deck
class Deck {
    static suits = ["Diamonds", "Hearts", "Spades", "Clubs"];
    static ranks = [
        { name: "2", value: 2 },
        { name: "3", value: 3 },
        { name: "4", value: 4 },
        { name: "5", value: 5 },
        { name: "6", value: 6 },
        { name: "7", value: 7 },
        { name: "8", value: 8 },
        { name: "9", value: 9 },
        { name: "10", value: 10 },
        { name: "Jack", value: 11 },
        { name: "Queen", value: 12 },
        { name: "King", value: 13 },
        { name: "Ace", value: 14 }
    ];
    static hierarchy = {
        HighCard: 0,
        Pair: 100,
        TwoPairs: 200,
        Three: 300,
        Straight: 400,
        Flush: 500,
        FullHouse: 600,
        Four: 700,
        StraightFlush: 800
    };

    constructor() {
        this.deck = [];
        let id = 0;
        for (const suit of Deck.suits) {
            for (const rank of Deck.ranks) {
                this.deck.push({img: `img/cards/${id}.png`, suit: suit, name: rank.name, value: rank.value});
                id++;
            }
        }
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    getCards() {
        let res = [];
        for (let i = 0; i < 5; i++) {
            res.push(this.deck.pop());
        }
        res.sort((a, b) => a.value - b.value);
        return [res, this.evaluateHand(res)];
    }

    drawCards(hand) {
        hand.forEach((v, i, a) => {
            if (v.inapt && this.deck.length > 0) {
                this.deck.unshift(a[i]); //FIXME shuffle
                a[i] = this.deck.pop();
            }
        });
        hand.sort((a, b) => a.value - b.value);
        return this.evaluateHand(hand);
    }

    evaluateHand(hand) { // expects sorted hand of 5 cards
        hand.forEach((v, i, a) => a[i].inapt = false)

        // check for flush
        const flushSuit = hand[0].suit;
        const isFlush = hand.every((card) => card.suit === flushSuit);

        // check for straight
        const isStraight =
            hand[0].value + 1 === hand[1].value &&
            hand[1].value + 1 === hand[2].value &&
            hand[2].value + 1 === hand[3].value &&
            hand[3].value + 1 === hand[4].value;

        // check for straight flush
        const isStraightFlush = isFlush && isStraight;

        if (isStraightFlush) {
            const value = hand[4].value;
            return {info: "Straight flush, high " + hand[4].name, value: value + Deck.hierarchy.StraightFlush, hierarchy: Deck.hierarchy.StraightFlush};
        }

        if (isFlush) {
            const value = hand[4].value;
            return {info: "Flush, high " + hand[4].name, value: value + Deck.hierarchy.Flush, hierarchy: Deck.hierarchy.Flush};
        }

        if (isStraight) {
            const value = hand[4].value;
            return {info: "Straight, high " + hand[4].name, value: value + Deck.hierarchy.StraightFlush, hierarchy: Deck.hierarchy.Straight};
        }

        // check for four of a kind
        if (hand[0].value === hand[3].value || hand[1].value === hand[4].value) {
            const value = hand[1].value;
            hand.forEach((v, i, a) => a[i].inapt = (a[i].value != value))
            return {info: "Four of " + hand[1].name, value: value + Deck.hierarchy.Four, hierarchy: Deck.hierarchy.Four};
        }

        // check for full house
        if ((hand[0].value === hand[1].value && hand[2].value === hand[4].value) ||
            (hand[0].value === hand[2].value && hand[3].value === hand[4].value)) {
            const value = hand[2].value;
            return {info: "Full house of " + hand[2].name, value: value + Deck.hierarchy.FullHouse, hierarchy: Deck.hierarchy.FullHouse};
        }

        // check for three of a kind
        if (hand[0].value === hand[2].value ||
            hand[1].value === hand[3].value ||
            hand[2].value === hand[4].value) {
            const value = hand[2].value;
            hand.forEach((v, i, a) => a[i].inapt = (a[i].value != value))
            return {info: "Three of " + hand[2].name, value: value + Deck.hierarchy.Three, hierarchy: Deck.hierarchy.Three};
        }

        // check for two pairs
        if ((hand[0].value === hand[1].value && hand[2].value === hand[3].value) ||
            (hand[0].value === hand[1].value && hand[3].value === hand[4].value) ||
            (hand[1].value === hand[2].value && hand[3].value === hand[4].value)) {
            const pairs = [hand[0].value, hand[1].value, hand[2].value, hand[3].value, hand[4].value];
            const values = pairs.filter((rank, index, arr) => arr.indexOf(rank) !== index);
            hand.forEach((v, i, a) => a[i].inapt = (a[i].value != values[0] && a[i].value != values[1]))
            const high = hand.filter((c) => c.value == values[1])[0];
            return {info: "Two pairs, high " + high.name, value: values[1] + Deck.hierarchy.TwoPairs, hierarchy: Deck.hierarchy.TwoPairs};
        }

        // check for one pair
        if (hand[0].value === hand[1].value || 
            hand[1].value === hand[2].value || 
            hand[2].value === hand[3].value || 
            hand[3].value === hand[4].value) {
            const pairs = [hand[0].value, hand[1].value, hand[2].value, hand[3].value, hand[4].value];
            const value = pairs.filter((rank, index, arr) => arr.indexOf(rank) !== index)[0];
            hand.forEach((v, i, a) => a[i].inapt = (a[i].value != value))
            const high = hand.filter((c) => c.value == value)[0];
            return {info: "One Pair of " + high.name, value: value + Deck.hierarchy.Pair, hierarchy: Deck.hierarchy.Pair};
        }

        // high card
        const value = hand[4].value;
        hand.forEach((v, i, a) => a[i].inapt = (i < 4))
        return {info: "High card " + hand[4].name, value: value + Deck.hierarchy.HighCard, hierarchy: Deck.hierarchy.HighCard};
    }
}

//**************************************************************************************************************************************** Agent
class Agent {
    state = State.Start;

    money = 5000;
    clothes = 4;
    cardsHidden = false;

    hand = null;
    evaluation = null;
    static infos = ["", "", "", "", "", "", "", "", "", ""];

    constructor() {

    }

    getMoney() {
        if (this.money >= 4000) {
            return this.money - 4000;
        } else if (this.money < 1000) {
            return this.money;
        } else {
            return this.money % 1000;
        }
    }

    getClothes() {
        if (this.money >= 4000) {
            return 4;
        } else if (this.money < 1000) {
            return 0;
        } else {
            return Math.floor(this.money / 1000);
        }
    }

    showMoney() {
        this.ui.money.textContent = "$" + this.getMoney();
        let c = this.getClothes();
        this.ui.cloth1.src = c > 0 ? "img/misc/shirt.png" : "img/misc/shirt-pawn.png";
        this.ui.cloth2.src = c > 1 ? "img/misc/shirt.png" : "img/misc/shirt-pawn.png";
        this.ui.cloth3.src = c > 2 ? "img/misc/shirt.png" : "img/misc/shirt-pawn.png";
        this.ui.cloth4.src = c > 3 ? "img/misc/shirt.png" : "img/misc/shirt-pawn.png";
    }

    showCards() {
        if (this.state >= State.Broke) {
            this.ui.card1.src = "img/cards/transparent.png";
            this.ui.card2.src = "img/cards/transparent.png";
            this.ui.card3.src = "img/cards/transparent.png";
            this.ui.card4.src = "img/cards/transparent.png";
            this.ui.card5.src = "img/cards/transparent.png";
        } else if (this.state >= State.BetFirst) {
            this.ui.card1.src = this.cardsHidden ? "img/cards/flipside.png" : this.hand[0].img;
            this.ui.card2.src = this.cardsHidden ? "img/cards/flipside.png" : this.hand[1].img;
            this.ui.card3.src = this.cardsHidden ? "img/cards/flipside.png" : this.hand[2].img;
            this.ui.card4.src = this.cardsHidden ? "img/cards/flipside.png" : this.hand[3].img;
            this.ui.card5.src = this.cardsHidden ? "img/cards/flipside.png" : this.hand[4].img;
            this.ui.card1.style.opacity = this.hand[0].inapt || this.state >= State.Fold || this.cardsHidden ? 0.5 : 0.9;
            this.ui.card2.style.opacity = this.hand[1].inapt || this.state >= State.Fold || this.cardsHidden ? 0.5 : 0.9;
            this.ui.card3.style.opacity = this.hand[2].inapt || this.state >= State.Fold || this.cardsHidden ? 0.5 : 0.9;
            this.ui.card4.style.opacity = this.hand[3].inapt || this.state >= State.Fold || this.cardsHidden ? 0.5 : 0.9;
            this.ui.card5.style.opacity = this.hand[4].inapt || this.state >= State.Fold || this.cardsHidden ? 0.5 : 0.9;
        }
    }

    deal() {
        this.state = State.BetFirst;
        [this.hand, this.evaluation] = game.deck.getCards();
        this.showCards();
    }

    wins() {
        let w = game.disburse();
        debug(this.id, `wins ${w}`)
        this.money += w;
        this.state = State.Done;
        this.showMoney();
        this.showInfo("win", w, this.evaluation.info);
    }

    loses() {
        debug(this.id, "loses");
        if (this.state != State.Fold) {
            this.showInfo("lose", this.evaluation.info);
        }
        this.state = this.money <= 0 ? State.Broke : State.Done;
    }

    bet(raise = 0) {
        let m = game.deposit(raise, this.money);
        this.money -= m;
        this.state = State.Bet;
        this.showMoney();
        this.showInfo("bet", m - raise, raise);
    }

    call() {
        let m = game.deposit(0, this.money);
        this.money -= m;
        this.state = State.Call;
        this.showMoney();
        this.showInfo("call", m);
    }

    fold() {
        this.state = State.Fold;
        this.showInfo("fold");
        this.showCards();
    }

    draw() {
        let inapt = this.hand.reduce((total, card) => card.inapt ? total + 1 : total, 0);
        let m = game.deposit(0, this.money);
        this.money -= m;
        this.state = State.Bet;
        this.showMoney();
        if (inapt == 0) {
            this.showInfo("bet", m, 0);
        } else {
            this.showInfo("draw", m, inapt);
            this.evaluation = game.deck.drawCards(this.hand);
            this.showCards();
        }
    }

    showInfo(action, a1 = null, a2 = null) {
        let text = action ? this.formatInfo(action, a1, a2) : "&nbsp";
        Agent.infos.shift();
        Agent.infos.push(text);
        game.player.ui.info.innerHTML = Agent.infos.join("<br>");
    }

}

//**************************************************************************************************************************************** Opponent
class Opponent extends Agent {

    clips = {};
    frameTime = 1/25;

    playingQueue = [];
    playingVideo = false;
    currentClip = null;
    steppingVideo = false;
    clipEndTime = null;
    stepEndTime = null;
    clipEndTime = null;
    lastVideoEnd = 0;
    showTimer = null;

    constructor(index, id) {
        super();
        this.index = index;
        this.id = id;
        this.name = id.replace(/^[0-9-]*/, "").replace(/-.*$/, "");
        this.name = this.name.charAt(0).toUpperCase() + this.name.slice(1);
        this.cardsHidden = true;
    }

    initUI() {
        this.ui = {
            video: document.getElementById(`opponent-${this.index+1}-video`),
            card1: document.getElementById(`opponent-${this.index+1}-card-1`),
            card2: document.getElementById(`opponent-${this.index+1}-card-2`),
            card3: document.getElementById(`opponent-${this.index+1}-card-3`),
            card4: document.getElementById(`opponent-${this.index+1}-card-4`),
            card5: document.getElementById(`opponent-${this.index+1}-card-5`),
            money: document.getElementById(`opponent-${this.index+1}-money`),
            cloth1: document.getElementById(`opponent-${this.index+1}-cloth-1`),
            cloth2: document.getElementById(`opponent-${this.index+1}-cloth-2`),
            cloth3: document.getElementById(`opponent-${this.index+1}-cloth-3`),
            cloth4: document.getElementById(`opponent-${this.index+1}-cloth-4`),
            info1: document.getElementById(`opponent-${this.index+1}-info-1`),
            info2: document.getElementById(`opponent-${this.index+1}-info-2`),
            info3: document.getElementById(`opponent-${this.index+1}-info-3`),
            info4: document.getElementById(`opponent-${this.index+1}-info-4`)
        }
        debug(this.id, `duration ${this.ui.video.duration} buffered ${this.ui.video.buffered}`);
    }

    initCallbacks() {
        this.ui.card1.addEventListener("click", this.cardHandler);
        this.ui.card2.addEventListener("click", this.cardHandler);
        this.ui.card3.addEventListener("click", this.cardHandler);
        this.ui.card4.addEventListener("click", this.cardHandler);
        this.ui.card5.addEventListener("click", this.cardHandler);
        this.ui.video.addEventListener('timeupdate', this.videoUpdateHandler);
        //this.ui.video.addEventListener('canplay', this.videoLoadedHandler);
    }

    cardHandler = () => {
        debug(this.id, "cardHandler");
        this.cardsHidden = !this.cardsHidden;
        this.showCards();
    }


    // videoLoadedHandler = () => { //Hack, show first frame of intro until start button clicked
    //     let clip = this.clips["intro-any-any-any"][4][0];
    //     debug(this.id, `set first frame to ${clip}`);
    //     this.ui.video.currentTime = clip.startTime;
    //     this.ui.video.removeEventListener('canplay', this.videoLoadedHandler);
    // }

    videoUpdateHandler = () => {
        if (this.playingVideo && this.ui.video.currentTime >= this.playEndTime) {
            this.ui.video.pause();
            if (this.ui.video.currentTime >= this.stepEndTime) {
                //debug(this.id, `video stop, current:${this.ui.video.currentTime.toFixed(3)} goal:${this.playEndTime.toFixed(3)} last:${this.clipEndTime.toFixed(3)}`);
                this.videoEnded();
            } else {
                this.startVideoStepping();
            }
        }
    }

    startVideoStepping() {
        //debug(this.id, `video start step current:${this.ui.video.currentTime.toFixed(3)} goal:${this.stepEndTime.toFixed(3)}`);
        let videoStepper = setInterval(() => {
            if (!this.steppingVideo) { // Apparently, there are still several events waiting in the queue.
            } else if (this.ui.video.currentTime < this.stepEndTime) {
                //debug(this.id, `video step ${this.ui.video.currentTime} ${this.stepEndTime} ${steps}`);
                this.ui.video.currentTime += this.frameTime;
            } else {
                clearInterval(videoStepper);
                //debug(this.id, `video stop step, current:${this.ui.video.currentTime.toFixed(3)} goal:${this.stepEndTime.toFixed(3)} last:${this.clipEndTime.toFixed(3)}`);
                this.videoEnded();
            }
        }, 2 * this.frameTime); // ??? Slow motion, js can't execute a callback every 40ms.
        this.steppingVideo = true;
    }

    videoEnded() {
        this.playingVideo = false; 
        this.steppingVideo = false;
        this.currentClip = null;
        this.ui.video.currentTime = this.clipEndTime;
        if (this.state == State.Intro) {
            this.state = State.Deal;
        }
        this.lastVideoEnd = Date.now();
        this.checkPlayingQueue();
    }

    playIntro() {
        this.state = State.Intro; //FIXME
        this.playVideo("intro");
    }

    playVideo(action, mod = "any", zoom = game.zoom ? "zoom" : "none", quiet = game.opponents.some((o) => o != this && o.playingVideo) ? "quiet" : "any", section = this.clothes) {
        let variants = [`${action}-any-any-any`, `${action}-any-any-${quiet}`, 
                        `${action}-any-${zoom}-any`, `${action}-any-${zoom}-${quiet}`,
                        `${action}-${mod}-any-any`, `${action}-${mod}-any-${quiet}`, 
                        `${action}-${mod}-${zoom}-any`, `${action}-${mod}-${zoom}-${quiet}`
                       ];
        let clips = null;
        let info = null;
        for (let v of variants) {
            if (v in this.clips && section in this.clips[v]) {
                clips = this.clips[v][section];
                info = v;
            }
        }
        if (clips) {
            let clip = clips[Math.floor(Math.random() * clips.length)];
            debug(this.id, `video enqueue ${info} ${clip.start} for ${action} ${section} ${mod} ${zoom} ${quiet}`);
            this.playingQueue.push(clip);
            this.checkPlayingQueue();
        } else if (action == "no") {
            this.playVideo("show", "drink", zoom, quiet, section);
        } else if (section < 4 && action != "on" && action != "off") {
            this.playVideo(action, mod, zoom, quiet, section + 1);
        } else {
            error(this.id, `no video for ${action} ${section} ${mod} ${zoom} ${quiet}`);
        }
    }

    checkPlayingQueue() {
        if (!this.playingVideo && this.playingQueue.length > 0) {
            if (this.showTimer) {
                clearTimeout(this.showTimer);
                this.showTimer = null;
                debug(this.id, "show timer cancel");
            }
            this.currentClip = this.playingQueue.shift();
            this.clipEndTime = this.currentClip.endTime - this.frameTime;
            this.stepEndTime = this.currentClip.endTime - 2 * this.frameTime;
            this.playEndTime = this.currentClip.endTime - 10 * this.frameTime;
            //debug(this.id, `video start ${this.currentClip.action} ${this.currentClip.startTime.toFixed(3)} play:${this.playEndTime.toFixed(3)} step:${this.stepEndTime.toFixed(3)} last:${this.clipEndTime.toFixed(3)}`);
            this.playingVideo = true;
            this.steppingVideo = false;
            if (this.currentClip.startTime < this.playEndTime) {
                this.ui.video.currentTime = this.currentClip.startTime;
                this.ui.video.play();
            } else {
                this.startVideoStepping();
            }
        } else if (playIdleVideos) {
            this.showTimer = setTimeout(() => {
                //debug(this.id, `show timer execute ${this.showTimer}`);
                if (this.showTimer && !this.playingVideo && !this.playingQueue.length && this.state >= State.BetFirst) {
                    this.showTimer = null; //FIXME fired but not executed before checkPlayingQueue()
                    let mod = "none";
                    if (this.state == State.Bet || this.state == State.BetFirst  || this.state == State.Call) {
                        mod = "cards";
                        if (this.evaluation.hierarchy < Deck.hierarchy.Pair) mod = "low";
                        if (this.evaluation.hierarchy >= Deck.hierarchy.Three) mod = "high";
                    }
                    this.playVideo("show", mod); 
                }
            }, 4000 + Math.random() * 8000 * game.opponents.length);
            //debug(this.id, `show timer start ${this.showTimer}`);
        }
        game.stateChanged("playing");
    }

    deal() {
        super.deal();
        if (cheatStupidOpponents) {
            this.playVideo("take");
        }
        //play video after draw()
    }

    activate() {
        if (cheatStupidOpponents) {
            this.bet(0);
            return;
        }

        if (game.agents.some((a) => a.state == State.Call)) {
            this.activateCall()
        } else {
            let raise = 0;
            if (this.evaluation.hierarchy >= Deck.hierarchy.Three) raise = 20;
            if (this.evaluation.hierarchy >= Deck.hierarchy.Flush) raise = 50;
            if (this.evaluation.hierarchy >= Deck.hierarchy.Four) raise = 100;
            if (this.state == State.BetFirst) {
                this.draw();
                let mod = "none";
                if (this.evaluation.hierarchy < Deck.hierarchy.Pair) mod = "bad";
                if (this.evaluation.hierarchy >= Deck.hierarchy.Three) mod = "good";
                this.playVideo("take", mod);
            } else if (this.evaluation.hierarchy < Deck.hierarchy.Pair && Math.random() > 0.5) {
                this.fold();
                this.playVideo("drop");
            } else if (this.money <= game.minWager + raise || Math.random() > this.evaluation.value / Deck.hierarchy.Flush || Math.random() > 0.95) {
                debug(this.id, `call with ${this.evaluation.value} ${Deck.hierarchy.Flush}`)
                this.call();
            } else {
                this.bet(raise);
            }
        }
    }

    activateCall() {
        if (this.evaluation.hierarchy < Deck.hierarchy.TwoPairs) {
            this.fold();
            this.playVideo("drop");
        } else {
            this.call();
        }
    }

    wins() {
        this.playVideo("win"); //FIXME youlose
        while (this.clothes < this.getClothes()) {
            this.clothes++;
            this.playVideo("on");
        }
        super.wins();
    }

    loses() {
        if (this.state != State.Fold) {
            this.playVideo("lose");
        }
        while (this.clothes > this.getClothes()) {
            this.clothes--;
            this.playVideo("off");
        }
        super.loses();
        if (this.state == State.Broke) {
            this.playVideo("broke");
            this.showCards();
        }
    }

    formatInfo(action, a1, a2) {
        switch (action) {
            case "win":
                return `${this.name} wins $${a1}, ${a2}`;
            case "lose":
                return `${this.name} loses, ${a1}`;
            case "bet":
                return a2 ? `${this.name} bets $${a1} and raises $${a2}` : `${this.name} bets $${a1}`;
            case "call":
                return `${this.name} bets $${a1} and calls`;
            case "draw":
                return `${this.name} bets $${a1} and draws ${a2} cards`;
            case "fold":
                return `${this.name} folds`;
            default:
                return `${this.name} ${action}`;
        }
    }

    busy() {
        return ((this.currentClip && this.currentClip.action != "show" && this.currentClip.action != "no") || 
                this.playingQueue.some((c) => (c.action != "show" && c.action != "no")));
    }
}

//**************************************************************************************************************************************** Player
class Player extends Agent {

    id = "player";
    confirmCallback = null;

    constructor() {
        super();
    }

    initUI() {
        this.ui = {
            card1: document.getElementById(`player-card-1`),
            card2: document.getElementById(`player-card-2`),
            card3: document.getElementById(`player-card-3`),
            card4: document.getElementById(`player-card-4`),
            card5: document.getElementById(`player-card-5`),
            money: document.getElementById(`player-money`),
            cloth1: document.getElementById(`player-cloth-1`),
            cloth2: document.getElementById(`player-cloth-2`),
            cloth3: document.getElementById(`player-cloth-3`),
            cloth4: document.getElementById(`player-cloth-4`),
            start: document.getElementById(`player-start`),
            load: document.getElementById(`player-load`),
            ok: document.getElementById(`player-ok`),
            wait: document.getElementById(`player-wait`),
            fold: document.getElementById(`player-fold`),
            draw: document.getElementById(`player-draw`),
            call: document.getElementById(`player-call`),
            bet1: document.getElementById(`player-bet1`),
            bet2: document.getElementById(`player-bet2`),
            bet3: document.getElementById(`player-bet3`),
            bet4: document.getElementById(`player-bet4`),
            bet5: document.getElementById(`player-bet5`),
            info: document.getElementById(`player-info`),
        }
    }

    initCallbacks() {
        this.ui.card1.addEventListener("click", this.card1handler);
        this.ui.card2.addEventListener("click", this.card2handler);
        this.ui.card3.addEventListener("click", this.card3handler);
        this.ui.card4.addEventListener("click", this.card4handler);
        this.ui.card5.addEventListener("click", this.card5handler);
        this.ui.start.addEventListener("click", this.startHandler);
        this.ui.ok.addEventListener("click", this.okHandler);
        this.ui.fold.addEventListener("click", this.foldHandler);
        this.ui.draw.addEventListener("click", this.drawHandler);
        this.ui.call.addEventListener("click", this.callHandler);
        this.ui.bet1.addEventListener("click", this.bet1handler);
        this.ui.bet2.addEventListener("click", this.bet2handler);
        this.ui.bet3.addEventListener("click", this.bet3handler);
        this.ui.bet4.addEventListener("click", this.bet4handler);
        this.ui.bet5.addEventListener("click", this.bet5handler);
    }

    card1handler = () => {
        debug(this.id, "card1handler");
        this.hand[0].inapt = !this.hand[0].inapt;
        this.showCards();
    }

    card2handler = () => {
        debug(this.id, "card2handler");
        this.hand[1].inapt = !this.hand[1].inapt;
        this.showCards();
    }

    card3handler = () => {
        debug(this.id, "card3handler");
        this.hand[2].inapt = !this.hand[2].inapt;
        this.showCards();
    }

    card4handler = () => {
        debug(this.id, "card4handler");
        this.hand[3].inapt = !this.hand[3].inapt;
        this.showCards();
    }

    card5handler = () => {
        debug(this.id, "card5handler");
        this.hand[4].inapt = !this.hand[4].inapt;
        this.showCards();
    }

    startHandler = () => {
        debug(this.id, "startHandler");
        this.ui.start.hidden = true;
        this.ui.wait.hidden = false;
        this.ui.info.hidden = false;
        game.start();
    }

    okHandler = () => {
        debug(this.id, "okHandler");
        if (this.confirmCallback) {
            let cb = this.confirmCallback;
            this.confirmCallback = null;
            cb();
        }
    }

    foldHandler = () => {
        debug(this.id, "foldHandler");
        this.showInfo("fold");
        this.state = State.Fold;
        game.endRound();
    }

    drawHandler = () => {
        debug(this.id, "drawHandler");
        this.draw();
        game.endRound();
    }

    callHandler = () => {
        debug(this.id, "callHandler");
        this.call();
        game.endRound();
    }

    bet1handler = () => {
        debug(this.id, "bet1handler");
        this.bet(0);
        this.state = State.Bet;
        game.endRound();
    }

    bet2handler = () => {
        debug(this.id, "bet2handler");
        this.bet(10);
        this.state = State.Bet;
        game.endRound();
    }

    bet3handler = () => {
        debug(this.id, "bet3handler");
        this.bet(20);
        this.state = State.Bet;
        game.endRound();
    }

    bet4handler = () => {
        debug(this.id, "bet4handler");
        this.bet(50);
        this.state = State.Bet;
        game.endRound();
    }

    bet5handler = () => {
        debug(this.id, "bet5handler");
        this.bet(100);
        this.state = State.Bet;
        game.endRound();
    }

    disableButtons() {
        let video = game.busy() || game.opponents.some((o) => o.busy()) || game.waitExit;
        let call = game.opponents.reduce((total, o) => o.state == State.Call ? total + 1 : total, 0);

        this.ui.ok.hidden = video;
        this.ui.wait.hidden = !video;

        if (this.state == State.GameDone || this.confirmCallback) {
            this.ui.ok.disabled = video;
            this.ui.ok.textContent = this.state == State.GameDone ? "Exit" : "OK";
        } else {
            this.ui.ok.disabled = true;
        }

        this.ui.call.textContent = `$${game.minWager} Call`;
        this.ui.draw.textContent = `$${game.minWager} Draw`;
        this.ui.bet1.innerHTML = `$${game.minWager}<br>&nbsp;<br>Bet`;
        this.ui.bet2.innerHTML = `$${game.minWager}<br>+<br>$10`;
        this.ui.bet3.innerHTML = `$${game.minWager}<br>+<br>$20`;
        this.ui.bet4.innerHTML = `$${game.minWager}<br>+<br>$50`;
        this.ui.bet5.innerHTML = `$${game.minWager}<br>+<br>$100`;

        if (this.state == State.GameDone || this.confirmCallback || (this.state != State.BetFirst && this.state != State.Bet)) {
            this.ui.fold.disabled = true;
            this.ui.call.disabled = true;
            this.ui.bet1.disabled = true;
            this.ui.bet2.disabled = true;
            this.ui.bet3.disabled = true;
            this.ui.bet4.disabled = true;
            this.ui.bet5.disabled = true;
        } else {
            this.ui.fold.disabled = video;
            this.ui.call.disabled = video;
            this.ui.bet1.disabled = this.money >= game.minWager ? video | call: true;
            this.ui.bet2.disabled = this.money >= game.minWager + 10 ? video | call : true;
            this.ui.bet3.disabled = this.money >= game.minWager + 20 ? video | call : true;
            this.ui.bet4.disabled = this.money >= game.minWager + 50 ? video | call : true;
            this.ui.bet5.disabled = this.money >= game.minWager + 100 ? video | call : true;
        }

        if (!this.hand || this.hand.every((v) => !v.inapt) || this.state == State.GameDone || this.confirmCallback || this.state != State.BetFirst) {
            this.ui.draw.disabled = true;
        } else {
            this.ui.draw.disabled = this.money >= game.minWager ? video : true;
        }
    }

    deal() {
        this.state = State.BetFirst;
        [this.hand, this.evaluation] = game.deck.getCards();
        if (cheatBetterCards) {
            this.evaluation = game.deck.drawCards(this.hand);
            this.evaluation = game.deck.drawCards(this.hand);
            this.evaluation = game.deck.drawCards(this.hand);
        }
        this.showCards();
    }

    activate() {
        this.disableButtons();
    }

    completed(callback) {
        this.confirmCallback = callback;
        this.showInfo(this.state == State.Broke ? "lose-game" : "win-game");
        this.state = State.GameDone;
        this.disableButtons();        
    }

    confirm(callback) {
        this.confirmCallback = callback;
        this.disableButtons();
    }

    formatInfo(action, a1, a2) {
        switch (action) {
            case "deal":
                return "";
            case "win":
                return `&nbsp;I win $${a1}, ${a2}`;
            case "lose":
                return `&nbsp;I lose, ${a1}`;
            case "bet":
                return a2 ? `&nbsp;I bet $${a1} and raise $${a2}` : `&nbsp;I bet $${a1}`;
            case "call":
                return `&nbsp;I bet $${a1} and call`;
            case "draw":
                return `&nbsp;I bet $${a1} and draw ${a2} cards`;
            case "fold":
                return `&nbsp;I fold`;
            case "lose-game":
                return `&nbsp;I lost the game.`;
            case "win-game":
                return `&nbsp;I won the game.`;
            default:
                return `&nbsp;I ${action}`;
        }
    }

}

//**************************************************************************************************************************************** Game
class Game {
    error = false;
    started = false;
    waitExit = false;
    quitCounter = 0;
    delay = false;

    opponents = [];
    player = null;
    agents = [];

    potMoney = 0;
    minWager = 10;
    zoom = false;

    static coinId = [   0,   10,   20,   30,   40,   50,   60,   70,   80,   90,
                      100,  110,  120,  130,  140,  150,  160,  170,  180,  190, 
                      200,  250,  300,  350,  400,  450,  500,  550,  600,  650,
                      700,  800, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, Infinity];

    constructor() {
    }

    init () {
        this.initAgents();
        this.initUI();
    }

    initAgents() {
        for (let o of selectedOpponents) {
            let id = o.match(/[^./]+$/)[0];
            debug(id, `opponent ${o}`);
            let opponent = new Opponent(this.opponents.length, id);
            this.opponents.push(opponent);
            this.agents.push(opponent);
            let lines = loadedFromLocalFile[id].split(/\r?\n|\r|\n/g);
            let start = "00:00:00.000"
            let action = "-"
            let section = 4
            let mod = "none"
            let zoom= "none"
            let quiet = "none"
            for (let l of lines) {
                let parts = l.split(/[ \t]+/).filter(Boolean);
                if (parts.length >= 3 && parts[0].match(/^\d\d:\d\d:\d\d:\d\d\d$/) && parts[2].match(/^\d$/)) {
                    let end = parts[0];
                    if (action == "bye" && (mod == "low" || mod == "high")) mod = "cards"; // FIXME convert timestamp files
                    if (mod != "youwin") this.addClip(opponent, start, end, action, section, mod, zoom, quiet); //FIXME implement logic for youwin
                    if (action == "drop") this.addClip(opponent, start, end, "lose", section, mod, zoom, quiet); //not enougt lose clips
                    if (action == "show" && mod == "cards") {
                        this.addClip(opponent, start, end, action, section, "low", zoom, quiet); //not enougt high/low clips
                        this.addClip(opponent, start, end, action, section, "high", zoom, quiet);
                    }
                    if (action == "show" && mod == "strip") this.addClip(opponent, start, end, action, section, "none", zoom, quiet); //FIXME implement strip button
                    start = end;
                    action = parts[1];
                    section = parts[2];
                    mod = "none";
                    zoom= "none";
                    quiet = "none";
                    for (let i = 3; i < parts.length; i++) {
                        switch (parts[i]) {
                            case "quiet":
                            case "mute":
                                quiet = parts[i];
                                break;
                            case "zoom":
                                zoom = parts[i];
                                break;
                            default:
                                mod = parts[i];
                        }
                    }
                }
            }
        }
        this.player = new Player();
        this.agents.push(this.player);
    }

    addClip(opponent, start, end, action, section, mod, zoom, quiet) {
        if (action != "-") {
            //debug(opponent.id, `${start}, ${end}, ${action}, ${section}, ${mod}, ${zoom}, ${quiet}`)
            let startTime = 60 * 60 * start.slice(0, 2) + 60 * start.slice(3, 5) + 1 * start.slice(6, 8) + start.slice(9, 12) / 1000;
            let endTime = 60 * 60 * end.slice(0, 2) + 60 * end.slice(3, 5) + 1 * end.slice(6, 8) + end.slice(9, 12) / 1000;
            let variants = [`${action}-any-any-any`,      `${action}-${mod}-any-any`,      `${action}-any-${zoom}-any`,      `${action}-${mod}-${zoom}-any`,
                            `${action}-any-any-${quiet}`, `${action}-${mod}-any-${quiet}`, `${action}-any-${zoom}-${quiet}`, `${action}-${mod}-${zoom}-${quiet}`];
            let clip = {start: start, startTime: startTime, end: end, endTime: endTime, action: action, section: section, mod: mod, zoom: zoom, quiet: quiet};
            for (let v of variants) {
                let a = opponent.clips[v];
                if (!a) {
                    a = {};
                    opponent.clips[v] = a;
                }
                let s = a[section];
                if (!s) {
                    s = [];
                    a[section] = s;
                }
                s.push(clip);
            }
        }
    }

    initUI() {
        for (let o of this.opponents) {
            o.initUI();
        }
        this.player.initUI();
        for (let o of this.opponents) {
            o.initCallbacks();
        }
        this.player.initCallbacks();

        this.ui = {
            quit: document.getElementById("quit"),
            hide: document.getElementById("hide"),
            drinkImg: document.getElementById("drink-img"),
            potImg: document.getElementById("pot-img"),
            potMoney: document.getElementById("pot-money"),
            fullscreen: document.getElementById("fullscreen"),
            startOverlay: document.getElementById(`start-overlay`),
            load: document.getElementById(`player-load`),
            start: document.getElementById(`player-start`),
        }
        this.ui.fullscreen.addEventListener("click", this.toggleFullscreen);
        this.ui.drinkImg.addEventListener("click", () => this.drink());
        this.ui.quit.addEventListener("click", () => this.quit());
        this.ui.load.hidden = true;
        this.ui.start.hidden = false;
    }

    toggleFullscreen() {
        if (!document.fullscreenElement &&    // standard
            !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {  // Vendor prefixes
            debug("game", "switch to fullscreen")
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.mozRequestFullScreen) {  // Firefox
                document.documentElement.mozRequestFullScreen();
            } else if (document.documentElement.webkitRequestFullscreen) {  // Chrome, Safari and Opera
                document.documentElement.webkitRequestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) {  // IE/Edge
                document.documentElement.msRequestFullscreen();
            }
        } else {
            debug("game", "switch to window mode")
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {  // Firefox
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {  // Chrome, Safari and Opera
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {  // IE/Edge
                document.msExitFullscreen();
            }
        }
    }

    drink() {
        let rnd = Math.random();
        for (let o of this.opponents) {
            let [action, mod] = rnd > 0.7 ? ["no", o.state >= State.Fold ? "none" : "cards"] : ["show", "drink"];
            debug("game", `${o.id} ${action} ${mod}`);
            o.playVideo(action, mod);
        }
    }

    quit() {
        if (!this.started || this.quitCounter > 0) {
            location.href = "index.html";
        } else {
            this.quitCounter++;
            this.ui.quit.style.backgroundColor = "red";
            for (let o of this.opponents) {
                o.playVideo("bye", o.state >= State.Fold ? "none" : "cards");
            }
        }
    }

    exit() {
        for (let o of this.opponents) {
            o.playVideo("bye", "none");
        }
        this.waitExit = true;
        this.stateChanged();
    }

    start() {
        for (let o of this.opponents) {
            o.playIntro();
        }
    }

    stateChanged() {
        if (this.opponents.some(o => o.state == State.Start)) {
            debug("game", "state Start, waiting");
            return;
        }
        if (this.opponents.some(o => o.state == State.Init)) {
            debug("game", "state Init, waiting");
            return;
        }
        if (this.opponents.some(o => o.state == State.Intro)) {
            debug("game", "state Intro, waiting");
            this.ui.startOverlay.style.display = "none";
            return;
        }
        if (!this.started && this.opponents.every(o => o.state == State.Deal)) {
            debug("game", "state Deal, dealing");
            this.ui.drinkImg.hidden = false;
            this.started = true;
            this.deal();
            return;
        }
        if (this.waitExit) {
            let video = game.opponents.some((o) => o.busy());
            if (!video) {
                location.href = "index.html";
            }
        } else {
            this.player.disableButtons();
        }
    }

    showPot() {
        this.ui.potMoney.textContent = "$" + this.potMoney;
        this.ui.potMoney.hidden = this.potMoney == 0;
        this.ui.potImg.src = `img/coins/${Game.coinId.reduce((t, v, i) => (v <= this.potMoney) ? i : t, 0)}.png`;
    }

    deposit(raise, max) {
        let amount = this.minWager + raise;
        if (amount > max) amount = max;
        this.minWager += raise;
        this.potMoney += amount;
        this.showPot();
        return amount;
    }

    disburse() {
        let r = game.potMoney;
        this.potMoney = 0;
        this.minWager = 10;
        this.showPot();
        return r;
    }

    deal() {
        this.player.showInfo("deal");
        if (this.agents.reduce((total, o) => o.state == State.Broke ? total : total + 1, 0) > 1) {
            this.deck = new Deck();
            for (let o of this.opponents.filter((o) => o.state != State.Broke)) {
                o.deal();
            }
            this.player.deal();
            this.startRound();
        } else {
            this.player.completed(() => this.exit());
        }
    }

    startRound() {
        if (this.quitCounter) {
            this.quitCounter = 0;
            this.ui.quit.style.backgroundColor = null;
        }

        //The opponents start each round, and the user goes last.
        for (let o of this.opponents.filter((o) => o.state != State.Fold && o.state != State.Broke)) {
            o.activate();
        }
        let active = this.agents.reduce((total, o) => o.state == State.Fold || o.state == State.Broke ? total : total + 1, 0);
        if (active >= 2 && (this.player.state == State.BetFirst || this.player.state == State.Bet)) {
            this.player.activate();
        } else {
            this.endRound();
        }
    }

    endRound() {
        let active = [];
        let winner = null;
        let call = this.agents.some((a) => a.state == State.Call)
        if (call) {
            this.opponents.forEach((o) =>  o.state == State.BetFirst || o.state == State.Bet ? o.activateCall() : null);
        }
        active = this.agents.filter((a) => a.state != State.Fold && a.state != State.Broke);

        if (active.length == 0) { //???
            winner = this.player;
        } else if (active.length == 1) {
            winner = active[0];
        } else if (call) {
            winner = this.player;
            active.filter((p) => p != this.player).forEach((o) => {
                if (o.evaluation.value > winner.evaluation.value) {
                    winner = o;
                }
            });
        }
        if (winner) {
            this.agents.filter((o) => o != winner && o.state != State.Broke).forEach((o) => o.loses());
            winner.wins();
            this.player.confirm(() => this.deal());
        } else {
            this.delay = true;
            this.player.disableButtons();
            setTimeout(() => {
                this.delay = false;
                this.startRound();
            }, 600);
        }
        if (Math.random() < 0.1) this.zoom = false;
        if (Math.random() > 0.9) this.zoom = true;
    }

    busy() {
        this.delay;
    }
}

//**************************************************************************************************************************************** Resizer

class Resizable {
    static barSize = 10;
    static mouseoverArea;
    static activeResizers = [];

    static init() {
        Resizable.mouseoverArea = document.getElementsByTagName("body")[0];

        for (let s of document.getElementsByClassName("horizontal-splitter")) {
            Resizable.activeResizers.push(new Resizable(s, true));
        }
        for (let s of document.getElementsByClassName("vertical-splitter")) {
            Resizable.activeResizers.push(new Resizable(s, false));
        }
    }

    constructor(splitter, horizontal) {
        this.splitter = splitter;
        this.horizontal = horizontal;
        this.content1 = splitter.children[0];
        this.bar = splitter.children[1];
        this.content2 = splitter.children[2];

        this.start = (e) => {
            //debug("Resizer", "start");
            e.preventDefault();
            e.stopPropagation();
            this.startPointerX = e.clientX;
            this.startPointerY = e.clientY;
            this.startW1 = this.content1.offsetWidth;
            this.startH1 = this.content1.offsetHeight;
            this.startW = this.splitter.offsetWidth;
            this.startH = this.splitter.offsetHeight;
            Resizable.mouseoverArea.addEventListener("pointermove", this.move);
            Resizable.mouseoverArea.addEventListener("pointerup", this.end);
        }

        this.move = (e) => {
            let x = e.clientX - this.startPointerX;
            let y = e.clientY - this.startPointerY;
            let p1 = 0;
            let p2 = 0;
            if (horizontal) {
                let w1 = this.startW1 + x;
                p1 = Math.round(w1 / (this.startW - Resizable.barSize) * 100);
                p1 = Math.min(Math.max(p1, 5), 95); //FIXME
                p2 = 100 - p1;
                this.splitter.style["grid-template-columns"] = `calc(${p1}% - ${Resizable.barSize/2}px)  ${Resizable.barSize}px  calc(${p2}% - ${Resizable.barSize/2}px)`;
            } else {
                let h1 = this.startH1 + y;
                p1 = Math.round(h1 / (this.startH - Resizable.barSize) * 1000) / 10;
                p1 = Math.min(Math.max(p1, 5), 95); //FIXME
                p2 = 100 - p1;
                this.splitter.style["grid-template-rows"] = `calc(${p1}% - ${Resizable.barSize/2}px)  ${Resizable.barSize}px  calc(${p2}% - ${Resizable.barSize/2}px)`;
            }
            //debug("Resizer", `move ${e.pageX} ${e.pageY} -> ${x} ${y} -> ${p1}% ${p2}%`);
        }

        this.end = (e) => {
            //debug("Resizer", "end");
            Resizable.mouseoverArea.removeEventListener("pointermove", this.move);
            Resizable.mouseoverArea.removeEventListener("pointerup", this.end);
        }

        this.bar.addEventListener("pointerdown", this.start);
    }
}

//**************************************************************************************************************************************** Start
const game = new Game();

window.addEventListener('load', function() {
    debug("load", "start...");
    Resizable.init();
    game.init();
});