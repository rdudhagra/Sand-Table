require("dotenv").config();

var fs = require('fs')
    , es = require('event-stream');

const {
    Worker, isMainThread, parentPort, workerData
} = require('worker_threads');

const fillModeOptions = {
    FILL: 0,
    FIT: 1
}

const X_SIZE = process.env.X_SIZE;
const Y_SIZE = process.env.Y_SIZE;
const MARGIN = 5;
const MIN_DISTANCE_FOR_ARC_CMD = 1.0;
const DISTANCE_PER_ARC_STEP = 1.0;
const MAX_THETA_FOR_ARC_STEP = Math.PI / 12;

const SCALE_FACTOR = Math.min(X_SIZE, Y_SIZE) / 2 - MARGIN;
const MIN_DISTANCE_FOR_ARC_CMD_SCALED = MIN_DISTANCE_FOR_ARC_CMD / SCALE_FACTOR;
const DISTANCE_PER_ARC_STEP_SCALED = DISTANCE_PER_ARC_STEP / SCALE_FACTOR;
const LINEAR_MOVEMENT_INSIDE_DIST_FROM_ORIGIN = 0.05;
const IGNORE_THETA_DISTANCE_FROM_ORIGIN = 0.000;

var _;

function clamp(n, min, max) {
    return Math.min(Math.max(n, min), max);
};

function scale([x, y], r = 0, fillMode = fillModeOptions.FIT) {
    if (fillMode == fillModeOptions.FILL) {
        x *= Math.SQRT2;
        y *= Math.SQRT2;
        r *= Math.SQRT2;
    }
    return [
        [
            clamp(x * SCALE_FACTOR + X_SIZE / 2, MARGIN, X_SIZE - MARGIN),
            clamp(y * SCALE_FACTOR + Y_SIZE / 2, MARGIN, Y_SIZE - MARGIN)
        ],
        clamp(r * SCALE_FACTOR, 0, 10000)
    ];
}

function polarToRectangular(rho, theta) {
    return [rho * Math.cos(theta), rho * Math.sin(theta)];
}

function rectangularToPolar(x, y) {
    return [Math.sqrt(x ** 2 + y ** 2), Math.atan2(y, x)];
}

function printRectangularCommand(stream, fillStream, cmd, coord) {
    var [fitCoord, _] = scale(coord, 0, fillModeOptions.FIT);
    stream.write(`${cmd} X${fitCoord[0].toFixed(3)} Y${fitCoord[1].toFixed(3)}\n`);

    var [fillCoord, _] = scale(coord, 0, fillModeOptions.FILL);
    fillStream.write(`${cmd} X${fillCoord[0].toFixed(3)} Y${fillCoord[1].toFixed(3)}\n`);
}

var prevR = 100; // basically a straight line
function printArcCommand(stream, fillStream, prevRho, prevTheta, rho, theta) {

    var [x1, y1] = polarToRectangular(prevRho, prevTheta);
    var [x3, y3] = polarToRectangular(rho, theta);

    if ((x3 - x1) ** 2 + (y3 - y1) ** 2 < MIN_DISTANCE_FOR_ARC_CMD_SCALED ** 2) {
        // linear movement
        printRectangularCommand(stream, fillStream, "G0", [x3, y3]);
        return;
    }

    var [x2, y2] = polarToRectangular((prevRho + rho) / 2, (prevTheta + theta) / 2);

    // console.log(`(${x1}, ${y1}), (${x2}, ${y2}), (${x3}, ${y3})`);

    var h, k, r;
    if ((Math.abs(x1) < IGNORE_THETA_DISTANCE_FROM_ORIGIN
        && Math.abs(y1) < IGNORE_THETA_DISTANCE_FROM_ORIGIN)
        || (Math.abs(x3) < IGNORE_THETA_DISTANCE_FROM_ORIGIN
            && Math.abs(y3) < IGNORE_THETA_DISTANCE_FROM_ORIGIN)) {
        r = Math.max(prevR, Math.sqrt((x3 - x1) ** 2 + (y3 - y1) ** 2) + 0.00001); // When using this shortcut, make sure
        // that the previous r value is valid, and if not, make it the minimum value plus a little extra
        // console.log("used old");
        [h, k] = findCenterOfCircleFromTwoPointsAndRadius(x1, y1, x3, y3, r);

    } else
        [h, k, r] = findRadiusAndCenterOfCircleFromPointsOnArc(x1, y1, x2, y2, x3, y3);
    prevR = r;

    // console.log(r * SCALE_FACTOR);

    if (isNaN(r) || !isFinite(r) || r > 1000)
        printRectangularCommand(stream, fillStream, "G0", [x3, y3]);
    else {
        // if (prevTheta > theta) stream.write("G2 ");
        // else stream.write("G3 ");

        // var [[scaledX, scaledY], scaledR] = scale([x3, y3], r);
        // stream.write(`X${scaledX.toFixed(5)} Y${scaledY.toFixed(5)} R${scaledR.toFixed(5)}\n`);

        var thetaStep = Math.min(DISTANCE_PER_ARC_STEP_SCALED / r, MAX_THETA_FOR_ARC_STEP);

        var [_, th1] = rectangularToPolar(x1 - h, y1 - k);
        var [_, th2] = rectangularToPolar(x3 - h, y3 - k);

        // console.log(`${h}\t\t${k}\t\t${th1}\t\t${th2}`);

        // Account for instances where the arc has an obtuse angle, and the above conversion
        // would result in the marble going the wrong way around the arc...by adding/subtracting
        // 2pi to th2
        var dirIsPositive = (theta - prevTheta) >= 0 ? true : false;
        if (dirIsPositive && th2 < th1) th2 += 2 * Math.PI;
        else if (!dirIsPositive && th2 > th1) th2 -= 2 * Math.PI;

        thetaStep *= dirIsPositive ? 1 : -1;
        th1 += thetaStep;
        while (dirIsPositive ? (th2 - th1 >= 0) : (th2 - th1 < 0)) {
            var [xAtZeroZero, yAtZeroZero] = polarToRectangular(r, th1);
            printRectangularCommand(stream, fillStream, "G0", [xAtZeroZero + h, yAtZeroZero + k]);
            th1 += thetaStep;
        }
        var [xAtZeroZero, yAtZeroZero] = polarToRectangular(r, th2);
        printRectangularCommand(stream, fillStream, "G0", [xAtZeroZero + h, yAtZeroZero + k]);
    }
}

function findCenterOfCircleFromTwoPointsAndRadius(x1, y1, x2, y2, radius) {
    var radsq = radius * radius;
    var q = Math.sqrt(((x2 - x1) ** 2) + ((y2 - y1) ** 2));

    var y3 = (y1 + y2) / 2;
    var x3 = (x1 + x2) / 2;

    return [x3 + Math.sqrt(radsq - ((q / 2) ** 2)) * ((y1 - y2) / q),
    y3 + Math.sqrt(radsq - ((q / 2) ** 2)) * ((x2 - x1) / q)];

}

function findRadiusAndCenterOfCircleFromPointsOnArc(x1, y1, x2, y2, x3, y3) {
    var x12 = x1 - x2;
    var x13 = x1 - x3;

    var y12 = y1 - y2;
    var y13 = y1 - y3;

    var y31 = y3 - y1;
    var y21 = y2 - y1;

    var x31 = x3 - x1;
    var x21 = x2 - x1;

    // x1^2 - x3^2 
    var sx13 = (Math.pow(x1, 2) -
        Math.pow(x3, 2));

    // y1^2 - y3^2 
    var sy13 = (Math.pow(y1, 2) -
        Math.pow(y3, 2));

    var sx21 = (Math.pow(x2, 2) -
        Math.pow(x1, 2));

    var sy21 = (Math.pow(y2, 2) -
        Math.pow(y1, 2));

    var f = ((sx13) * (x12)
        + (sy13) * (x12)
        + (sx21) * (x13)
        + (sy21) * (x13))
        / (2 * ((y31) * (x12) - (y21) * (x13)));
    var g = ((sx13) * (y12)
        + (sy13) * (y12)
        + (sx21) * (y13)
        + (sy21) * (y13))
        / (2 * ((x31) * (y12) - (x21) * (y13)));

    var c = -Math.pow(x1, 2) - Math.pow(y1, 2) -
        2 * g * x1 - 2 * f * y1;

    // eqn of circle be x^2 + y^2 + 2*g*x + 2*f*y + c = 0 
    // where centre is (h = -g, k = -f) and radius r 
    // as r^2 = h^2 + k^2 - c 
    var h = -g;
    var k = -f;
    var sqr_of_r = h * h + k * k - c;

    // r is the radius 
    return [h, k, Math.sqrt(sqr_of_r) + 0.00001]; // Add a small amount here
    // to counteract roundoff error: if the radius is too small, Marlin will crash;
    // however, the inaccuracy caused by this addition is so small I doubt anyone will notice.
}

function process_file(filename, callback) {

    var prevRho, prevTheta = null;

    var outStream = fs.createWriteStream(__dirname + "/../../files/" + filename + ".gcode");
    var outFillStream = fs.createWriteStream(__dirname + "/../../files/" + filename + " (fill).gcode");

    var inStream = fs.createReadStream(__dirname + "/../../files/" + filename + ".thr")
        .pipe(es.split())
        .pipe(es.mapSync(function (line) {

            // pause the readstream
            inStream.pause();

            // process line here and call s.resume() when ready
            // function below was for logging memory usage
            if (line.length > 0 && !line.startsWith("#") && !line.startsWith("//") && !line.startsWith(";")) {
                // Process line...not a comment
                var [theta, rho] = line.split(new RegExp("\\s+")).filter((v) => { return v.length > 0 });
                theta = parseFloat(theta);
                rho = parseFloat(rho);

                if (Math.abs(rho) - Math.abs(prevRho) > 0 && prevRho < IGNORE_THETA_DISTANCE_FROM_ORIGIN && rho < LINEAR_MOVEMENT_INSIDE_DIST_FROM_ORIGIN) {
                    // console.log("ignoring");
                    prevTheta = theta;
                } else if (Math.abs(rho) - Math.abs(prevRho) < 0 && rho < IGNORE_THETA_DISTANCE_FROM_ORIGIN && prevRho < LINEAR_MOVEMENT_INSIDE_DIST_FROM_ORIGIN) {
                    // console.log("ignoring2");
                    theta = prevTheta;
                }

                // console.log(`(${prevRho}, ${prevTheta}), (${rho}, ${theta})`);

                if (prevRho == null) {
                    prevRho = rho;
                    prevTheta = theta;
                    printRectangularCommand(outStream, outFillStream, "G0", polarToRectangular(prevRho, prevTheta));
                } else {
                    var dtheta = theta - prevTheta;
                    var drho = rho - prevRho;
                    const pi = Math.PI - 0.00001; // Intentionally NOT exactly pi
                    while (Math.abs(dtheta) > pi) {
                        // handle cases where dtheta can be greater than 1/2 rev (>pi) 
                        // by splitting them up into intervals of pi radians

                        var newTheta = prevTheta + pi * (dtheta >= 0 ? 1 : -1);
                        var newRho = prevRho + drho * Math.abs(pi / dtheta);

                        printArcCommand(outStream, outFillStream, prevRho, prevTheta, newRho, newTheta);

                        prevTheta = newTheta;
                        prevRho = newRho;

                        dtheta = theta - prevTheta;
                        drho = rho - prevRho;

                        // console.log("split up");

                    };

                    printArcCommand(outStream, outFillStream, prevRho, prevTheta, rho, theta);
                    prevRho = rho;
                    prevTheta = theta;
                }
            }

            // resume the readstream, possibly from a callback
            inStream.resume();
        })
            .on('error', function (err) {
                console.log('Error while reading file.', err);
            })
            .on('end', function () {
                console.log('Done converting ' + filename + '.thr to gcode');
                outStream.end(() => callback());
            })
        );
}

function process_thr_file_to_gcode(filename, callback) {
    // Use worker thread
    const id = Math.random(); // Random uuid to distinguish this call from others to avoid race conditions
    const worker = new Worker(__filename, {
        workerData: { fn: "process_file", filename: filename, id: id }
    });
    worker.on('message', (val) => {
        if (val == id)
            callback();
    });
}

module.exports.X_SIZE = X_SIZE;
module.exports.Y_SIZE = Y_SIZE;

if (isMainThread) {
    module.exports.process_thr_file_to_gcode = process_thr_file_to_gcode;
} else {
    // A worker thread has been created, call the requested function
    switch (workerData.fn) {
        case "process_file":
            process_file(workerData.filename, () => parentPort.postMessage(workerData.id));
            break;
    }
}