require("dotenv").config();

import express from "express";
import http from "http";
import bodyParser from "body-parser";
import processupload from "./routes/process_upload";
import trackmanager from "./routes/track_manager";
import ledcontroller from "./routes/led_controller";
import playlistmanager from "./routes/playlist_manager";

const app = express();

// Disable caching
app.set('etag', false);
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
});

// Static resources
app.use(express.static(__dirname + "/../src"));
app.use(express.static(__dirname + "/../files"));

// For handling POST requests
app.use(bodyParser.json({limit: '50MB'}));
app.use(bodyParser.urlencoded({ extended: false, limit: '50MB' }));

// Add subroutes
app.use("/file-upload", processupload);
app.use("/tracks", trackmanager);
app.use("/led", ledcontroller);
app.use("/playlists", playlistmanager);

app.listen(process.env.NODE_ENV == "production" ? process.env.PRODUCTION_PORT : process.env.PORT, () =>
  console.log(`Server (${process.env.NODE_ENV}) is listening on port ${process.env.NODE_ENV == "production" ? process.env.PRODUCTION_PORT : process.env.PORT}`)
);
