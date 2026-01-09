"use strict";

function debug(id, text) {
    console.log(`[${id}] ${text}`)
}

function error(id, text) {
    console.log(`ERROR [${id}] ${text}`)
}

const server = "localhost:5746";

//**************************************************************************************************************************************** Editor
class Editor {
    error = false;
    started = false;
    dirty = false;

    fps = null;
    duration = 0;
    startTime = 0;
    currentTime = 0;
    targetTime = null;
    playTime = null;
    currentPieces = 4;
    currentZoom = false;

    frameInfo = null; //255 scene cut, >250 scen cut, >0 sound 
    inVideoPositionChanged = 0

    constructor() {
    }

    init () {
        this.id = hrefVars.id1;

        this.initUI();

        this.initVideoInfo();
    }

    initUI() {
        let cfg = {
            startOverlay:   ["start-overlay"],
            page:           ["page"],
            videoArea:      ["video-area"],
            bottomArea:     ["bottom-area"],

            mainVideo:      ["main-video"],
            mainVideoFrame: ["main-videoframe"],
            startVideo:     ["start-video"],
            endVideo:       ["end-video"],
            editor:         ["editor"],
            editorMark:     ["editor-mark"],

            pieces4:        ["pieces4",         "Digit4", () => this.insertTimestampText(null, null, 4)],
            pieces3:        ["pieces3",         "Digit3", () => this.insertTimestampText(null, null, 3)],
            pieces2:        ["pieces2",         "Digit2", () => this.insertTimestampText(null, null, 2)],
            pieces1:        ["pieces1",         "Digit1", () => this.insertTimestampText(null, null, 1)],
            pieces0:        ["pieces0",         "Digit0", () => this.insertTimestampText(null, null, 0)],
            zoom:           ["zoom",            "Digit5", () => this.insertTimestampText(null, null, this.currentPieces, !this.currentZoom)],
            intro:          ["intro",           "KeyI",   () => this.insertTimestampText("intro", null, 4, "ignore")],
            take:           ["take",            "KeyT",   () => this.insertTimestampText("take")],
            takeGood:       ["take-good",       "KeyG",   () => this.insertTimestampText("take", "good")],
            takeBad:        ["take-bad",        "KeyB",   () => this.insertTimestampText("take", "bad")],
            drop:           ["drop",            "KeyD",   () => this.insertTimestampText("drop")],
            dropThrow:      ["drop-throw",      "KeyR",   () => this.insertTimestampText("drop", "throw")],
            win:            ["win",             "KeyW",   () => this.insertTimestampText("win")],
            winYoulose:     ["win-youlose",     "KeyQ",   () => this.insertTimestampText("win", "youlose")],
            lose:           ["lose",            "KeyL",   () => this.insertTimestampText("lose")],
            loseYouwin:     ["lose-youwin",     "KeyP",   () => this.insertTimestampText("lose", "youwin")],
            show:           ["show",            "KeyS",   () => this.insertTimestampText("show")],
            showCards:      ["show-cards",      "KeyC",   () => this.insertTimestampText("show", "cards")],
            showCardsLow:   ["show-cards-low",  "KeyE",   () => this.insertTimestampText("show", "low")],
            showCardsHigh:  ["show-cards-high", "KeyH",   () => this.insertTimestampText("show", "high")],
            showDrink:      ["show-drink",      "KeyK",   () => this.insertTimestampText("show", "drink")],
            showNo:         ["show-no",         "KeyN",   () => this.insertTimestampText("no")],
            showCardsNo:    ["show-cards-no",   "KeyJ",   () => this.insertTimestampText("no", "cards")],
            showStrip:      ["show-strip",      "KeyX",   () => this.insertTimestampText("show", "strip")],
            trash:          ["trash",           "KeyA",   () => this.insertTimestampText("-", null, this.currentPieces, "ignore")],
            off0:           ["off0",            null,     () => this.insertTimestampText("off", null, 0, "ignore")],
            off1:           ["off1",            null,     () => this.insertTimestampText("off", null, 1, "ignore")],
            off2:           ["off2",            null,     () => this.insertTimestampText("off", null, 2, "ignore")],
            off3:           ["off3",            null,     () => this.insertTimestampText("off", null, 3, "ignore")],
            on1:            ["on1",             null,     () => this.insertTimestampText("on", null, 1, "ignore")],
            on2:            ["on2",             null,     () => this.insertTimestampText("on", null, 2, "ignore")],
            on3:            ["on3",             null,     () => this.insertTimestampText("on", null, 3, "ignore")],
            on4:            ["on4",             null,     () => this.insertTimestampText("on", null, 4, "ignore")],
            bye:            ["bye",             "Digit6", () => this.insertTimestampText("bye")],
            byeCards:       ["bye-cards",       "Digit7", () => this.insertTimestampText("bye", "cards")],
            broke:          ["broke",           "Digit8", () => this.insertTimestampText("broke", null, 0, "ignore")],
            end:            ["end",             "Digit9", () => this.insertTimestampText("-", "end", 0, "ignore")],

            videoInfo:      ["video-info"],
            startInfo:      ["start-info"],
            videoPosition:  ["video-position"],
            
            videoStart:     ["video-start",       "Home",             () => this.videoPositionChanged(0)],
            videoPrevSnap4: ["video-prev-snap4",  "ArrowLeft-shift",  () => this.videoPositionChanged(this.searchFrame(this.currentTime, -1, 255))],
            videoPrevSnap1: ["video-prev-snap1",  "ArrowLeft-ctrl",   () => this.videoPositionChanged(this.searchFrame(this.currentTime, -1, 250))],
            videoPrev:      ["video-prev",        "ArrowLeft",        () => this.videoPositionChanged(this.addFrame(this.currentTime, -1))],
            videoPlay:      ["video-play",        "Space-shift",      () => this.toggleVideoPlay(false)],
            videoPlaySnap:  ["video-play-snap",   "Space",            () => this.toggleVideoPlay(1)],
            videoPlaySnap4: ["video-play-snap4",  "KeyM",             () => this.toggleVideoPlay(4)],
            videoNext:      ["video-next",        "ArrowRight",       () => this.videoPositionChanged(this.addFrame(this.currentTime, 1))],
            videoNextSnap1: ["video-next-snap1",  "ArrowRight-ctrl",  () => this.videoPositionChanged(this.searchFrame(this.currentTime, 1, 250))],
            videoNextSnap4: ["video-next-snap4",  "ArrowRight-shift", () => this.videoPositionChanged(this.searchFrame(this.currentTime, 1, 255))],
            videoEnd:       ["video-end",         "End",              () => this.videoPositionChanged(this.addFrame(this.duration, -1))],
            videoTime:      ["video-time"],
            videoStartTime: ["video-starttime"],

            setStart:       ["set-start",         null,               () => this.startPositionChanged(this.currentTime)],
            editorAdd:      ["editor-add"],
            editorPrev:     ["editor-prev",       "ArrowUp",          () => this.editorMoveLine(-1, true, true)],
            editorNext:     ["editor-next",       "ArrowDown",        () => this.editorMoveLine(1, true, true)],
            //editorSync:   ["editor-sync"],
            editorPlayTime: ["editor-play-time",  "Enter",            () => {this.editorMoveLine(0, true, true); this.editorMoveLine(1, false, false, true); this.editorMoveLine(-1, false, false); this.toggleVideoPlay()}],
            //editorSetStart: ["editor-set-start",  "ArrowUp-shift",    () => this.editorMoveLine(0, true, false)],
            //editorSetEnd:   ["editor-set-end",    "ArrowDown-shift",  () => this.editorMoveLine(0, false, true)],

            save:           ["save",              "KeyS-ctrl",        () => this.save()],
            back:           ["back",              null,               () => location.href = "index.html"],
        };
        this.ui = {};
        this.keymap = {};
        for (let [k, v] of Object.entries(cfg)) {
            this.ui[k] = document.getElementById(v[0]);
            if (v[2]) {
                this.ui[k].addEventListener("click", v[2]);
                if (v[1]) {
                    this.keymap[v[1]] = v[2];
                }
            }
        }

        this.ui.pieces = [this.ui.pieces0, this.ui.pieces1, this.ui.pieces2, this.ui.pieces3, this.ui.pieces4];

        this.ui.videoPosition.addEventListener("input", () => this.videoPositionChanged(this.frameTimestamp(this.ui.videoPosition.value)));
        this.ui.mainVideo.addEventListener('timeupdate', () => this.videoPositionChanged(null, false));

        this.ui.editor.addEventListener("selectionchange", () => {this.updateEditorMark();}); // FIXME: set vedeo time
        // this.ui.editor.addEventListener("selectionchange", () => {this.updateEditorMark(); this.editorMoveLine(0, true, true)}); delay until initialized
        this.ui.editor.addEventListener("scroll", () => this.ui.editorMark.scrollTop = this.ui.editor.scrollTop);
        this.ui.editor.addEventListener("input", () => {this.dirty = true; this.checkButtons();}); // FIMME: timestamp edited

        this.ui.videoInfo.width = this.ui.videoInfo.offsetWidth;
        const ctx = this.ui.videoInfo.getContext("2d");
        ctx.font = "16px sans-serif";
        ctx.fillStyle = "red";
        ctx.fillText("Waiting for scene markers...",20,20);

        this.ui.startInfo.width = this.ui.startInfo.offsetWidth;

        let keylistener = (event) => {
            let key = `${event.code}${event.shiftKey ? "-shift" : ""}${event.ctrlKey ? "-ctrl" : ""}${event.metaKey ? "-meta" : ""}`;
            debug("Key", `${key} ${event.target} ${key in this.keymap}`);
            if (this.started && !(event.target instanceof HTMLTextAreaElement) && key in this.keymap) {
                event.stopPropagation();
                event.preventDefault(); //space key activates button
                this.keymap[key]();
            }
        };
        this.ui.page.addEventListener("keydown", keylistener, true);

        //window.addEventListener('resize', resizeCanvas, false);
    }

    checkButtons() {
        if (this.dirty) {
            this.ui.save.disabled = false;
            this.ui.back.disabled = true;
        } else {
            this.ui.save.disabled = true;
            this.ui.back.disabled = false;
        }
    }

    async initVideoInfo() {
        let myObject = await fetch(`http://${server}/fps?id=${this.id}`);
        let txt = await myObject.text();
        this.fps = parseFloat(txt)

        myObject = await fetch(`http://${server}/gettime?id=${this.id}`);
        txt = await myObject.text();
        this.setLines(0, 0, 0, txt.split("\n"))
        this.dirty = false;
        this.checkButtons();

        myObject = await fetch(`http://${server}/sceneinfo?id=${this.id}`);
        this.frameInfo = await myObject.bytes();
        this.renderVideoInfo();

        this.duration = this.roundFrame(this.ui.mainVideo.duration);
        this.ui.videoPosition.max = this.frameNumber(this.duration);
        this.ui.videoPosition.value = 0;

        this.ui.startOverlay.style.display = "none";
        //this.ui.editor.addEventListener("selectionchange", () => {this.updateEditorMark(); this.editorMoveLine(0, true, true)});
        this.started = true;
    }

    renderVideoInfo() {
        let canvas = this.ui.videoInfo;
        //canvas.width = canvas.offsetWidth;
        let scale = canvas.width / this.frameInfo.length;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "white";
        for (let i = this.frameInfo.length; i>= 0; i--) {
            let v = this.frameInfo[i];
            if (v > 0 && v <= 200) {
                let pos = i * scale;
                ctx.beginPath();
                ctx.moveTo(pos, 0);
                ctx.lineTo(pos, v / 10);
                ctx.stroke();
            }
        }
        ctx.strokeStyle = "black";
        for (let i = this.frameInfo.length; i>= 0; i--) {
            let v = this.frameInfo[i];
            if (v == 255) {
                //let pos = Math.round(i * scale) - 0.5;
                let pos = i * scale;
                ctx.beginPath();
                ctx.moveTo(pos, 10);
                ctx.lineTo(pos, 30);
                ctx.stroke();
            } else if (v == 254) {
                //let pos = Math.round(i * scale) - 0.5;
                let pos = i * scale;
                ctx.beginPath();
                ctx.moveTo(pos, 20);
                ctx.lineTo(pos, 30);
                ctx.stroke();
            }
        }
    }

    renderStartInfo() {
        let canvas = this.ui.startInfo;
        //canvas.width = canvas.offsetWidth;
        let scale = canvas.width / this.frameInfo.length;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let p1 = this.frameNumber(this.startTime);
        let p2 = this.frameNumber(this.currentTime);
        if (p1 == p2) {
            ctx.strokeStyle = "red";
            ctx.beginPath();
            ctx.moveTo(p1 * scale, 0);
            ctx.lineTo(p1 * scale, 30);
            ctx.stroke();
        } else if (p2 < p1) {
            ctx.fillStyle = "red";
            ctx.fillRect(p2 * scale, 20, (p1 - p2) * scale, 5);
        } else {
            ctx.fillStyle = "green"
            ctx.fillRect(p1 * scale, 20, (p2 - p1) * scale, 5);
        }
    }

    videoPositionChanged(ts = null, pauseVideo = true) {
        if (this.inVideoPositionChanged) {
            debug("Video", "inVideoPositionChanged");
            return;
        }
        this.inVideoPositionChanged++;
        try {
            //debug("video", `current ${this.ui.mainVideo.currentTime} end ${this.playTime}`);
            if (this.playTime !== null && this.ui.mainVideo.currentTime >= this.playTime) {
                pauseVideo = true;
                ts = this.targetTime;
                debug("Video", `target ${ts}`);
            }
            if (pauseVideo && !this.ui.mainVideo.paused) {
                this.ui.mainVideo.pause();
                this.ui.mainVideoFrame.style.backgroundColor = null;
                this.ui.mai
            }
            if (ts === null) {
                ts = this.ui.mainVideo.currentTime;
            }
            this.currentTime = this.roundFrame(ts);
            if (pauseVideo) {
                //debug("Video", `set time ${this.currentTime}`);
                this.ui.mainVideo.currentTime = this.currentTime;
                this.ui.endVideo.currentTime = this.addFrame(this.currentTime, -1);
                this.playTime = null;
                this.targetTime = null;
            }
            this.ui.videoPosition.value = this.frameNumber();
            this.ui.videoTime.textContent = this.formatTime() + " frame " + this.frameNumber();
            this.renderStartInfo();
        } finally {
            this.inVideoPositionChanged--;
        }
    }

    startPositionChanged(ts) {
        this.ui.startVideo.currentTime = ts;
        this.startTime = ts;
        this.ui.videoStartTime.textContent = this.formatTime(this.startTime) + " frame " + this.frameNumber(this.startTime);
        this.renderStartInfo();
    }

    toggleVideoPlay(snap) {
        if (this.ui.mainVideo.paused) {
            if (snap) {
                let frame = this.frameNumber() + 1;
                if (frame >= this.frameInfo.length) frame = this.frameInfo.length - 1;
                while (frame < this.frameInfo.length && this.frameInfo[frame] < (snap == 4 ? 255 : 250)) {
                    frame++;
                }
                this.targetTime = this.frameTimestamp(frame);
                this.playTime = this.addFrame(this.targetTime, -2);
            }
            this.ui.mainVideo.play();
            this.ui.mainVideoFrame.style.backgroundColor = "oldlace";
        } else {
            this.videoPositionChanged();
        }
    }

    roundFrame(time) {
        let r = Math.round(time * this.fps) / this.fps;
        //debug ("Video", `round time ${time} to ${r}`);
        return r;
    }

    searchFrame(time, add, snap) {
        let f = this.frameNumber(time);
        do {
            f += add;
        } while (f >= 0 && f < this.frameInfo.length && this.frameInfo[f] < snap);
        f = Math.min(Math.max(f, 0), this.frameInfo.length - 1)
        return this.frameTimestamp(f);
    }

    addFrame(time, add) {
        let r = this.roundFrame(time + add / this.fps);
        if (r >= this.duration) r = this.duration - 1 / this.fps;
        if (r < 0) r = 0;
        return r;
    }

    frameNumber(ts = this.currentTime) {
        return Math.round(ts * this.fps);
    }

    frameTimestamp(ts) {
        return Math.round(ts) / this.fps;
    }

    formatTime(ts = this.currentTime) {
        let [h, m, s, f] = [Math.floor(ts / (60 * 60)), Math.floor(ts / 60) % 60, Math.floor(ts % 60), Math.round(ts * 1000) % 1000]
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${f.toString().padStart(3, '0')}`;
    }

    scanTime(line) {
        let m = line.match(/(\d\d):(\d\d):(\d\d):(\d\d\d)/)
        return m ? (parseInt(m[1]) * 60 + parseInt(m[2])) * 60 + parseInt(m[3]) + parseInt(m[4]) / 1000 : 0; //FIXME errormessage
    }

    getLines() {
        let textarea = this.ui.editor;
        let position = {row: 0, column: 0, selection: 0, lines: []};
        let lines = textarea.value.substr(0, textarea.selectionStart).split("\n");
        position.row = lines.length - 1;
        position.column = lines[lines.length - 1].length;
        position.selection = textarea.selectionEnd - textarea.selectionStart;
        position.lines = textarea.value.split("\n");
        return position;
    }

    setLines(row, column, length, lines, setValue = true) {
        let textarea = this.ui.editor;
        let selStart = 0;
        for (let i = 0; i < row; i++) {
            selStart += lines[i].length + 1;
        }
        selStart += column;
        if (setValue) {
            let text = lines.join("\n"); // + "\n";
            textarea.value = text;
            this.dirty = true;
            this.checkButtons();
        }
        textarea.selectionStart = selStart;
        textarea.selectionEnd = selStart + length;
    }

    updateEditorMark() {
        //debug("editor", "update editor mark");
        let lines = this.ui.editor.value.substr(0, this.ui.editor.selectionStart).split("\n");
        let row = lines.length - 1;
        lines = this.ui.editor.value.split("\n");
        let mark = "\n".repeat(row) + "=>" + "\n".repeat(lines.length + row)
        this.ui.editorMark.value = mark;
    }

    editorMoveLine(add, setStart, setCurrent, setTarget = false) {
        let c = this.getLines();
        let row = c.row + add;
        row = Math.min(Math.max(row, 0), c.lines.length - 1)
        let tline = c.lines[row]
        this.setLines(row, 0, 0, c.lines, false);
        if (setStart || setCurrent || setTarget) {
            let ts = this.scanTime(tline);
            if (setStart) this.startPositionChanged(ts);
            if (setCurrent) this.videoPositionChanged(ts);
            if (setTarget) {
                this.targetTime = ts;
                this.playTime = this.addFrame(ts, -2);
            }
        }
    }

    insertTimestampText(action, mod = null, pieces = this.currentPieces, zoom = this.currentZoom) {
        if (action) {
            let clipStart = this.frameNumber(this.startTime);
            let clipEnd = this.frameNumber(this.currentTime);
            let quiet = true;
            for (let i = clipStart; quiet && i < clipEnd; i++) {
                if (this.frameInfo[i] > 1 && this.frameInfo[i] < 250) quiet = false;
            }

            let c = this.getLines();
            //let start = c.lines[c.row].slice(0, 12);
            let l1 = `${this.formatTime(this.startTime)} ${action.padEnd(5, " ")} ${pieces} ${(mod ? mod : "").padEnd(7, " ")} ${zoom === true ? "zoom" : "    "} ${quiet ? "quiet" : "     "}`;
            c.lines[c.row] = l1;
            if (this.ui.editorAdd.checked && mod != "end") {
                c.row++;
                let l2 = this.formatTime();
                c.lines.splice(c.row, 0, l2);
            }
            this.setLines(c.row, 0, 12, c.lines);

            this.startPositionChanged(this.currentTime);
        }

        if (pieces != this.currentPieces) {
            this.currentPieces = pieces;
            this.ui.pieces[pieces].checked = true;
        }
        if (zoom != "ignore" && zoom != this.currentZoom) {
            this.currentZoom = zoom;
            this.ui.zoom.checked = zoom;
        }
    }

    async save() {
        let body = this.ui.editor.value;
        let myObject = await fetch(`http://${server}/savetime?id=${this.id}`, {
            method: "POST",
            body: body
        });
        let txt = await myObject.text();
        debug("Save", txt);
        this.dirty = false;
        this.checkButtons();
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
                p1 = Math.round(w1 / (this.startW - Resizable.barSize) * 1000) / 10;
                p1 = Math.min(Math.max(p1, 5), 95); //FIXME
                p2 = 100 - p1;
                this.splitter.style["grid-template-columns"] = `calc(${p1}% - ${Resizable.barSize/2}px)  ${Resizable.barSize}px  calc(${p2}% - ${Resizable.barSize/2}px)`;
            } else {
                let h1 = this.startH1 + y;
                p1 = Math.round(h1 / (this.startH - Resizable.barSize) * 100);
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
const editor = new Editor();

window.addEventListener('load', function() {
    debug("load", "start...");
    Resizable.init();
    editor.init();
});