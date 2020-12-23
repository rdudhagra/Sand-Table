import express from 'express';
import fs from 'fs';
import path from 'path';
const { fork } = require('child_process');

const GCodeProcess = fork(path.join(__dirname, "gcode_controller.js"));

const router = express.Router();

var currentTracks = [];
var isPaused = false;
var speed = 100;
var repeat = false;

GCodeProcess.on("message", (msg) => {
    if (msg != "Done") return;

    if (currentTracks.length == 0) return;
    if (currentTracks[0] != "") console.log("Done running " + currentTracks[0]);
    if (repeat)
        currentTracks.push(currentTracks.shift());
    else currentTracks.shift();
    setTimeout(() => {
        if (currentTracks.length > 0) GCodeProcess.send({ msg: "sendFile", args: [currentTracks[0]] }); // send next track in playlist
    }, 3000);
    isPaused = false;
});

router.get('/repeat', function (req, res) {
    res.send("" + repeat);
});

router.post('/setRepeat', function (req, res) {
    repeat = req.body.repeat;
    res.sendStatus(200);
});

router.get('/list', function (req, res) {
    var files = fs.readdirSync(__dirname + "/../../files");

    // Finds all files in the directory that have the .gcode extension, and where
    // a file of the same name, but with .png extension exists in the directory.
    // Then, sends the list with the .gcode stripped off the end
    res.send(
        files.filter((v) => {
            return v.endsWith(".gcode") && !v.includes(" (fill).") && files.includes(v.replace(".gcode", ".png"));
        }).map((v) => v.replace(".gcode", ""))
    );
});

router.get('/current', function (req, res) {
    res.send(currentTracks);
});

router.post('/setCurrent', function (req, res) {
    console.log("New track list: " + req.body.tracks.toString());
    if (req.body.tracks[0] == currentTracks[0]) {
        currentTracks = req.body.tracks;
        return res.sendStatus(200);
    }
    currentTracks = req.body.tracks;
    isPaused = false;
    if (currentTracks.length > 0)
        GCodeProcess.send({ msg: "sendFile", args: [currentTracks[0]] });
    res.sendStatus(200);
});

router.post('/control', function (req, res) {
    switch (req.body.cmd) {
        case "play":
            isPaused = false;
            GCodeProcess.send({ msg: "resume", args: [] });
            break;
        case "pause":
            isPaused = true;
            GCodeProcess.send({ msg: "pause", args: [] });
            break;
        case "stop":
            currentTracks = [];
            GCodeProcess.send({ msg: "stop", args: [] });
            break;
    }
    res.sendStatus(200);
});

router.get('/isPaused', function (req, res) {
    res.send(isPaused);
})

router.post('/setSpeed', function (req, res) {
    speed = req.body.speed;
    GCodeProcess.send({ msg: "setSpeed", args: [req.body.speed] });
    res.sendStatus(200);
});

router.get('/speed', function (req, res) {
    res.send("" + speed);
});

export default router;