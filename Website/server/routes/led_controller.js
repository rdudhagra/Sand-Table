require("dotenv").config();

import express from 'express';

const SerialPort = require('serialport');
const router = express.Router();

const PORT = process.env.LED_STRIP_ARDUINO_SERIAL_PORT;

var mode = "0";

const port = new SerialPort(PORT, {
  baudRate: 2400,
}).on("error", (e) => console.log(e));

router.post("/set", function (req, res) {
  var cmd = Buffer.from(decodeURIComponent(req.body.cmd));
  switch (cmd[0]) {
    case '#'.charCodeAt(0):
      // Setting a new solid color
      mode = cmd.toString();
      cmd = Buffer.from([
        '#'.charCodeAt(0),
        parseInt(cmd.slice(1, 3).toString(), 16),
        parseInt(cmd.slice(3, 5).toString(), 16),
        parseInt(cmd.slice(5, 7).toString(), 16),
      ]);
      break;
    case '!'.charCodeAt(0):
      // Setting new brightness, no need to change mode
      cmd = Buffer.from([
        '!'.charCodeAt(0),
        parseInt(cmd.slice(1, 3).toString(), 16),
      ]);
      break;
    default:
      // Setting mode to a predefined pattern
      mode = "" + cmd[0];
      cmd = cmd.slice(0, 1);
      break;
  }
  port.write(cmd);
  console.log("Sent cmd to led strip: [" + Array.from(cmd.values()) + "]");
  res.sendStatus(200);
});

router.get("/get", function (req, res) {
  res.send(mode);
});

export default router;
