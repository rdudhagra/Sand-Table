import express from 'express';
import fs from 'fs';
import 'array.prototype.move';

const JSON_DIR = __dirname + "/../../files/playlists.json";

var playlists;
try {
    playlists = JSON.parse(fs.readFileSync(JSON_DIR));
} catch (error) {
    playlists = {};
    fs.writeFileSync(JSON_DIR, JSON.stringify(playlists));
}

const router = express.Router();

router.get('/list', function (req, res) {
    res.json(playlists);
});

router.post('/new', function (req, res) {
    playlists[req.body.name] = [];
    fs.writeFileSync(JSON_DIR, JSON.stringify(playlists));
    res.sendStatus(200);
});

router.post('/addTrack', function (req, res) {
    playlists[req.body.playlistName].push(req.body.trackName);
    fs.writeFileSync(JSON_DIR, JSON.stringify(playlists));
    res.sendStatus(200);
});

router.post('/removeTrack', function (req, res) {
    playlists[req.body.playlistName].splice(req.body.trackIndex, 1);
    fs.writeFileSync(JSON_DIR, JSON.stringify(playlists));
    res.sendStatus(200);
});

router.post('/shiftTrackUp', function (req, res) {
    if (req.body.trackIndex > 0) {
        playlists[req.body.playlistName].move(req.body.trackIndex, req.body.trackIndex - 1);
        fs.writeFileSync(JSON_DIR, JSON.stringify(playlists));
    }
    res.sendStatus(200);
});

router.post('/shiftTrackDown', function (req, res) {
    if (req.body.trackIndex < playlists[req.body.playlistName].length - 1) {
        playlists[req.body.playlistName].move(req.body.trackIndex, req.body.trackIndex + 1);
        fs.writeFileSync(JSON_DIR, JSON.stringify(playlists));
    }
    res.sendStatus(200);
});

router.post('/rename', function (req, res) {
    playlists[req.body.newName] = playlists[req.body.playlistName];
    delete playlists[req.body.playlistName];
    fs.writeFileSync(JSON_DIR, JSON.stringify(playlists));
    res.sendStatus(200);
});

router.post('/delete', function (req, res) {
    delete playlists[req.body.playlistName];
    fs.writeFileSync(JSON_DIR, JSON.stringify(playlists));
    res.sendStatus(200);
});

export function deleteTrack(trackName) {
    for (let [playlist, tracks] of Object.entries(playlists)) {
        playlists[playlist] = tracks.filter((t) => t != trackName);
    }
    fs.writeFileSync(JSON_DIR, JSON.stringify(playlists));
}

export function renameTrack(trackName, newName) {
    for (let [playlist, tracks] of Object.entries(playlists)) {
        playlists[playlist] = tracks.map((t) => t == trackName ? newName : t);
    }
    fs.writeFileSync(JSON_DIR, JSON.stringify(playlists));
}

export default router;