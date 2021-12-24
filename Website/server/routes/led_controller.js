require("dotenv").config();

import express from 'express';
import path from 'path';

var cmd = require('node-cmd');
cmd.runSync(path.resolve(path.join(__dirname, '../../flash-light-strip-controller.sh')));

const SerialPort = require('serialport');
const router = express.Router();

const PORT = process.env.LED_STRIP_ARDUINO_SERIAL_PORT;

var mode = "0";

const port = new SerialPort(PORT, {
  baudRate: 115200,
});
port.on("error", (e) => console.log(e));

var cmd_interval = null;
var cmd_res = null;
port.on('data', function (data) {
  data = data.toString();
  console.log(`Received data from led strip controller: ${data}`);
  if (cmd_interval != null && cmd_res != null && data.includes("ack")) {
    clearInterval(cmd_interval);
    cmd_interval = null;
    cmd_res.sendStatus(200);
    cmd_res = null;
  }
})

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
    case '@'.charCodeAt(0):
      // Setting new speed, no need to change mode
      cmd = Buffer.from([
        '@'.charCodeAt(0),
        parseInt(cmd.slice(1, 3).toString(), 16),
      ]);
      break;
    default:
      // Setting mode to a predefined pattern
      mode = "" + cmd[0];
      cmd = cmd.slice(0, 1);
      break;
  }

  // Add start and end characters
  cmd = Buffer.concat([Buffer.from("["), cmd, Buffer.from("]\n")])
  port.flush(() => {
    // Send same command several times because FastLED messes with Arduino Serial (so some packets are lost)
    cmd_res = res;
    var send_cnt = 0;
    cmd_interval = setInterval(() => {
      port.write(cmd);
      port.drain(() => {
        console.log("Sent cmd to led strip: [" + Array.from(cmd.values()) + "]");
      });

      if (++send_cnt === 50) {
        clearInterval(cmd_interval);
        cmd_interval = null;
        cmd_res.sendStatus(200);
        cmd_res = null;
    }
    }, 5);
  });
});

router.get("/get", function (req, res) {
  res.send(mode);
});

export default router;
