"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const fs = require("fs");
const path = require("path");
const util_1 = require("util");
// module.exports = { spawn: p_spawn };
const fsUnlink = util_1.promisify(fs.unlink);
const fsAccess = util_1.promisify(fs.access);
const fsMkdir = util_1.promisify(fs.mkdir);
var defaultSpawnOpts = {};
async function spawn(cmd, arg_1, arg_2) {
    // get the eventual opts and build the spawn option
    const args = (arg_1 && arg_1 instanceof Array) ? arg_1 : undefined;
    const _opts = (args) ? arg_2 : !(arg_1 instanceof Array) ? arg_1 : undefined;
    const opts = Object.assign({}, defaultSpawnOpts, _opts);
    // if toConsole is undefined, set it to true if no capture or onStdout
    if (opts.toConsole == null && !opts.capture && !opts.onStdout) {
        opts.toConsole = true;
    }
    // build the spawn options
    const cpOpts = extractCPOptions(opts) || {};
    // make sure it is an array if defined
    const capture = (opts.capture && typeof opts.capture === "string") ? [opts.capture] : opts.capture;
    const stdoutData = (capture && capture.includes("stdout")) ? [] : null;
    const stderrData = (capture && capture.includes("stderr")) ? [] : null;
    let stdout = "pipe";
    let stderr = "pipe";
    if (opts.toFile) {
        opts.toConsole = false; // can only one or the other. 
        let toFileInfo = path.parse(opts.toFile);
        await fsMkdirs(toFileInfo.dir);
        if (await fsExists(opts.toFile)) {
            await fsUnlink(opts.toFile);
        }
        stdout = fs.openSync(opts.toFile, "a");
        stderr = fs.openSync(opts.toFile, "a");
    }
    // If we have toConsole and no capture and no onStd binding, we output to std
    if (opts.toConsole && !opts.onStdout && stdoutData == null) {
        stdout = process.stdout;
    }
    // If we have toConsole and no capture and no onStd binding, we output to std
    if (opts.toConsole && !opts.onStderr && stderrData == null) {
        stderr = process.stderr;
    }
    // the passed stdio will aways take precedence
    var stdio = cpOpts.stdio || ["pipe", stdout, stderr];
    cpOpts.stdio = stdio;
    return new Promise(function (resolve, reject) {
        // build the params list depending of what has been defined
        // TODO: Needs to have the right types (still does not below with the cp.spawn.apply)
        const params = [cmd];
        if (args) {
            params.push(args);
        }
        if (cpOpts) {
            params.push(cpOpts);
        }
        // if we have the toConsole
        if (opts.toConsole) {
            console.log(">>> Will execute: " + fullCmd(cmd, args));
            if (cpOpts && cpOpts.cwd) {
                console.log("        from dir: " + cpOpts.cwd);
            }
        }
        // FIXME: need to 
        var ps = cp.spawn.apply(cp, params);
        if (ps.stdout) {
            ps.stdout.on("data", (data) => {
                stdHandler(data, opts.onStdout, stdoutData, (opts.toConsole) ? process.stdout : null);
            });
        }
        if (ps.stderr) {
            ps.stderr.on("data", (data) => {
                stdHandler(data, opts.onStderr, stderrData, (opts.toConsole) ? process.stderr : null);
            });
        }
        ps.on('close', (code) => {
            if (!opts.ignoreFail && code !== 0) {
                reject(new Error(`Error executing ` + fullCmd(cmd, args)));
            }
            else {
                const r = { code: code };
                if (stdoutData != null) {
                    r.stdout = stdoutData.join("");
                }
                if (stderrData != null) {
                    r.stderr = stderrData.join("");
                }
                resolve(r);
            }
        });
        ps.on("error", (err) => {
            reject(err);
        });
    });
}
exports.spawn = spawn;
// TOOD: Need to type
function stdHandler(data, onStd, stdData, processStd) {
    // if we have a onStd... 
    if (onStd) {
        onStd(data);
    }
    // if we need to capture the data
    if (stdData != null) {
        stdData.push(data.toString());
    }
    // if we have a processStd (because of toConsole was set, we write the datda)
    if (processStd) {
        processStd.write(data);
    }
}
function fullCmd(cmd, args) {
    if (args) {
        cmd += " " + args.join(" ");
    }
    return cmd;
}
const spawnOptionNames = { "cwd": true, "env": true, "argv0": true, "stdio": true, "detached": true, "uid": true, "gid": true, "shell": true };
function extractCPOptions(opts) {
    if (!opts) {
        return;
    }
    // TODO: need to type
    const cpOpts = {};
    let hasVal = false;
    for (let key in opts) {
        if (spawnOptionNames[key]) {
            const v = opts[key];
            if (v != null) {
                hasVal = true;
                cpOpts[key] = v;
            }
        }
    }
    if (hasVal) {
        return cpOpts;
    }
}
// --------- File Utils --------- //
// Create all the missing path for this folder
async function fsMkdirs(folderPath) {
    var folders = [];
    var tmpPath = path.normalize(folderPath);
    var exists = await fsExists(tmpPath);
    while (!exists) {
        folders.push(tmpPath);
        tmpPath = path.join(tmpPath, '..');
        exists = await fsExists(tmpPath);
    }
    for (var i = folders.length - 1; i >= 0; i--) {
        await fsMkdir(folders[i]);
    }
}
async function fsExists(path) {
    try {
        await fsAccess(path);
        return true;
    }
    catch (ex) {
        return false;
    }
}
// --------- /File Utils --------- //
//# sourceMappingURL=index.js.map