const SerialPort = require('serialport');
var fs = require('fs');
const { exit, send } = require('process');
const Process_Theta_Rho = require('./process_theta_rho');
const { start } = require('repl');

const PORT = "/dev/tty.usbmodem142201";
const DEBUG = false;

var paused = false;
var doneCallback = () => { };

var file = [];
var index = 0;
var backwards = false;
var endPos = [Process_Theta_Rho.X_SIZE / 2, Process_Theta_Rho.Y_SIZE / 2] // Ball is in center

var cmdQueue = [];

const port = new SerialPort(PORT, {
    baudRate: 250000
}).on("error", (e) => console.log(e));
var portParser = new SerialPort.parsers.Readline();
port.pipe(portParser);

function sendNextCmd(justExecuteWithoutReadingPort = false, dat) {
    if (paused) return; // Don't do anything with the sand table if paused

    var data = justExecuteWithoutReadingPort ? "ok" : dat;

    if (DEBUG) console.log(justExecuteWithoutReadingPort ? "override" : data.toString('utf8'));

    if (data.toString('utf8').includes("ok")) {
        if (cmdQueue.length > 0) {
            var cmd = cmdQueue.shift();
            port.write(cmd + "\n");
            if (DEBUG) console.log("Send CMD: " + cmd);
        } else if (index >= 0 && index < file.length) {
            // Send next gcode command
            if (file[index] == "") {
                index += backwards ? -1 : 1; // Recursively go to next cmd until valid one is found
                sendNextCmd(true);           // When valid cmd found or reached end of file, 
                return;                      // the recursive tree will collapse gracefully
            }
            port.write(file[index] + "\n");
            if (DEBUG) console.log("Send CMD: " + file[index]);
            index += backwards ? -1 : 1;
        } else {
            if (file.length > 0)
                doneCallback();
            file = [];
            index = 0;
        }
    }
}
portParser.on('data', (dat) => sendNextCmd(false, dat));

function sendFile(filename) {
    pause();
    // Clear file buffer if another file is running
    if (file.length > 0) stop();

    setTimeout(() => {

        file = fs.readFileSync(__dirname + "/../../files/" + filename + ".gcode")
            .toString()
            .split("\n")
            .filter(function (el) {
                return el != null && el != "";
            });

        var amountFromFirst = 0;
        var firstCmd = file[amountFromFirst];
        while (firstCmd == "") {
            amountFromFirst++;
            firstCmd = file[amountFromFirst];
        }
        firstCmd = firstCmd.split(' ');

        var startPos = [parseFloat(firstCmd[1].replace("X", "")), parseFloat(firstCmd[2].replace("Y", ""))];

        if (Math.abs(startPos[0] - Process_Theta_Rho.X_SIZE / 2) < 50
            && Math.abs(startPos[1] - Process_Theta_Rho.Y_SIZE / 2) < 50
            && Math.abs(endPos[0] - Process_Theta_Rho.X_SIZE / 2) < 50
            && Math.abs(endPos[1] - Process_Theta_Rho.Y_SIZE / 2) < 50)
            backwards = false; // End of prev, start of next at center...do nothing special

        else if (Math.abs(endPos[0] - Process_Theta_Rho.X_SIZE / 2) < 50
            && Math.abs(endPos[1] - Process_Theta_Rho.Y_SIZE / 2) < 50) {

            // ended at center, but start of next is along the outside
            backwards = true;

        } else if (Math.abs(startPos[0] - Process_Theta_Rho.X_SIZE / 2) < 50
            && Math.abs(startPos[1] - Process_Theta_Rho.Y_SIZE / 2) < 50) {

            // ended on outside, but start of next is at center
            backwards = true;

            var amountFromLast = 1;
            var lastCmd = file[file.length - amountFromLast];
            while (lastCmd == "") {
                amountFromLast++;
                lastCmd = file[file.length - amountFromLast];
            }
            lastCmd = lastCmd.split(' ');

            startPos = [parseFloat(lastCmd[1].replace("X", "")), parseFloat(lastCmd[2].replace("Y", ""))];

            if (Math.abs(endPos[0] - startPos[0]) > 50 && Math.abs(endPos[1] - startPos[1]) > 50) {

                var moveCmd = [];
                var minDist = Math.min(
                    endPos[0], Process_Theta_Rho.X_SIZE - endPos[0],
                    endPos[1], Process_Theta_Rho.Y_SIZE - endPos[1]);

                switch (minDist) {
                    case endPos[0]:
                        moveCmd.push("G0 X0");
                        if (startPos[1] < Process_Theta_Rho.Y_SIZE - startPos[1])
                            moveCmd.push("G0 Y0");
                        else
                            moveCmd.push(`G0 Y${Process_Theta_Rho.Y_SIZE}`);

                        moveCmd.push(`G0 X${startPos[0]}`);
                        break;

                    case Process_Theta_Rho.X_SIZE - endPos[0]:
                        moveCmd.push(`G0 X${Process_Theta_Rho.X_SIZE}`);
                        if (startPos[1] < Process_Theta_Rho.Y_SIZE - startPos[1])
                            moveCmd.push("G0 Y0");
                        else
                            moveCmd.push(`G0 Y${Process_Theta_Rho.Y_SIZE}`);

                        moveCmd.push(`G0 X${startPos[0]}`);
                        break;

                    case endPos[1]:
                        moveCmd.push("G0 Y0");
                        if (startPos[0] < Process_Theta_Rho.X_SIZE - startPos[0])
                            moveCmd.push("G0 X0");
                        else
                            moveCmd.push(`G0 X${Process_Theta_Rho.X_SIZE}`);

                        moveCmd.push(`G0 Y${startPos[1]}`);
                        break;

                    case Process_Theta_Rho.Y_SIZE - endPos[1]:
                        moveCmd.push(`G0 Y${Process_Theta_Rho.Y_SIZE}`);
                        if (startPos[0] < Process_Theta_Rho.X_SIZE - startPos[0])
                            moveCmd.push("G0 X0");
                        else
                            moveCmd.push(`G0 X${Process_Theta_Rho.X_SIZE}`);

                        moveCmd.push(`G0 Y${startPos[1]}`);
                        break;
                }

                if (DEBUG) console.log(moveCmd);
                file = [].concat(file, moveCmd.reverse());
            }

        } else {
            // ended on outside, start of next is on outside
            backwards = false;

            if (Math.abs(endPos[0] - startPos[0]) > 50 && Math.abs(endPos[1] - startPos[1]) > 50) {
                // Only do move sequence if startPos and endPos are a significant distance apart
                // ...in this case, more than 50mm apart (otherwise, just execute pattern)
                var moveCmd = [];
                var minDist = Math.min(
                    endPos[0], Process_Theta_Rho.X_SIZE - endPos[0],
                    endPos[1], Process_Theta_Rho.Y_SIZE - endPos[1]);

                switch (minDist) {
                    case endPos[0]:
                        moveCmd.push("G0 X0");
                        if (startPos[1] < Process_Theta_Rho.Y_SIZE - startPos[1])
                            moveCmd.push("G0 Y0");
                        else
                            moveCmd.push(`G0 Y${Process_Theta_Rho.Y_SIZE}`);

                        moveCmd.push(`G0 X${startPos[0]}`);
                        break;

                    case Process_Theta_Rho.X_SIZE - endPos[0]:
                        moveCmd.push(`G0 X${Process_Theta_Rho.X_SIZE}`);
                        if (startPos[1] < Process_Theta_Rho.Y_SIZE - startPos[1])
                            moveCmd.push("G0 Y0");
                        else
                            moveCmd.push(`G0 Y${Process_Theta_Rho.Y_SIZE}`);

                        moveCmd.push(`G0 X${startPos[0]}`);
                        break;

                    case endPos[1]:
                        moveCmd.push("G0 Y0");
                        if (startPos[0] < Process_Theta_Rho.X_SIZE - startPos[0])
                            moveCmd.push("G0 X0");
                        else
                            moveCmd.push(`G0 X${Process_Theta_Rho.X_SIZE}`);

                        moveCmd.push(`G0 Y${startPos[1]}`);
                        break;

                    case Process_Theta_Rho.Y_SIZE - endPos[1]:
                        moveCmd.push(`G0 Y${Process_Theta_Rho.Y_SIZE}`);
                        if (startPos[0] < Process_Theta_Rho.X_SIZE - startPos[0])
                            moveCmd.push("G0 X0");
                        else
                            moveCmd.push(`G0 X${Process_Theta_Rho.X_SIZE}`);

                        moveCmd.push(`G0 Y${startPos[1]}`);
                        break;
                }

                if (DEBUG) console.log(moveCmd);
                file = [].concat(moveCmd, file);
            }
        }

        index = backwards ? file.length - 1 : 0;

        // Process file by switching G3 to G2 and vice versa if running backwards
        if (backwards) {
            for (var cmd of file) {
                cmd.toString().replace(/G2|G3/g, function (m) {
                    // `m` is a matched string.
                    return m === 'G2' ? 'G3' : 'G2';
                })
            }
        }

        if (backwards) {
            var amountFromFirst = 0;
            var firstCmd = file[amountFromFirst];
            while (firstCmd == "") {
                amountFromFirst++;
                firstCmd = file[amountFromFirst];
            }
            firstCmd = firstCmd.toString().split(' ');

            endPos = [parseFloat(firstCmd[1].replace("X", "")), parseFloat(firstCmd[2].replace("Y", ""))];

        } else {
            var amountFromLast = 1;
            var lastCmd = file[file.length - amountFromLast];
            while (lastCmd == "") {
                amountFromLast++;
                lastCmd = file[file.length - amountFromLast];
            }
            lastCmd = lastCmd.split(' ');

            endPos = [parseFloat(lastCmd[1].replace("X", "")), parseFloat(lastCmd[2].replace("Y", ""))];
        }

        // Start the file
        resume();
        sendNextCmd(true);
        console.log("Playing track: " + filename);

    }, 1000);
}

function pause() {
    paused = true;
}

function resume() {
    paused = false;
    sendNextCmd(true);
}

function stop() {
    if (backwards) {
        var amountFromFirst = index;
        var firstCmd = file[amountFromFirst];
        while (firstCmd == "") {
            amountFromFirst++;
            firstCmd = file[amountFromFirst];
        }
        // console.log(firstCmd);
        firstCmd = firstCmd.toString().split(' ');

        // console.log(file[index]);
        // console.log(firstCmd);
        if (firstCmd.length != 3) endPos = [0, 0];
        else endPos = [parseFloat(firstCmd[1].replace("X", "")), parseFloat(firstCmd[2].replace("Y", ""))];

    } else {
        var amountFromLast = index;
        var lastCmd = file[amountFromLast];
        while (lastCmd == "") {
            amountFromLast--;
            lastCmd = file[amountFromLast];
        }
        // console.log(lastCmd);
        lastCmd = lastCmd.split(' ');

        // console.log(file[index]);
        // console.log(lastCmd);

        if (lastCmd.length != 3) endPos = [0, 0];
        else endPos = [parseFloat(lastCmd[1].replace("X", "")), parseFloat(lastCmd[2].replace("Y", ""))];
    }

    file = [];
    index = 0;
}

function setDoneCallback(cb) {
    doneCallback = cb;
}

function setSpeed(newSpeed) {
    cmdQueue.push(`M220 S${parseFloat(newSpeed).toFixed(0)}`);
    console.log("Set speed to " + newSpeed + "%");
}

// Send first line
setTimeout(() => {
    // Start gcode
    backwards = false;
    index = 0;
    file = [
        "G90",
        "G28",
        "M220 S100",
        `G0 X${Process_Theta_Rho.X_SIZE / 2} Y${Process_Theta_Rho.Y_SIZE / 2}`, // center of table
    ];
    sendNextCmd(true); // Run start gcode
    console.log("GCode Controller Initialized");
}, 5000);

module.exports.sendFile = sendFile;
module.exports.pause = pause;
module.exports.resume = resume;
module.exports.stop = stop;
module.exports.setDoneCallback = setDoneCallback;
module.exports.setSpeed = setSpeed;