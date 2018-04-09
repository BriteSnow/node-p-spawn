const cp = require("child_process");
const fs = require("fs");
const path = require("path");
const { promisify } = require('util');

module.exports = { spawn: p_spawn };

const fsUnlink = promisify(fs.unlink);
const fsAccess = promisify(fs.access);
const fsMkdir = promisify(fs.mkdir);

var defaultSpawnOpts = {
	toConsole: true
};

// See types/index.d.ts for doc
async function p_spawn(cmd, a_args, a_opts) {

	// get the eventual opts and build the spawn option
	var opts = (arguments.length === 3) ? a_opts : a_args;
	opts = Object.assign({}, defaultSpawnOpts, opts);

	// build the spawn options
	var cpOpts = extractCPOptions(opts) || {};

	// make sure it is an array if defined
	var capture = (opts.capture && typeof opts.capture === "string") ? [opts.capture] : opts.capture;
	var stdoutData = (capture && capture.includes("stdout")) ? [] : null;
	var stderrData = (capture && capture.includes("stderr")) ? [] : null;

	var stdout = "pipe", stderr = "pipe";

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
		var params = [cmd];
		if (a_args) {
			params.push(a_args);
		}
		if (cpOpts) {
			params.push(cpOpts);
		}

		// if we have the toConsole for the stdout (and no capture), we print the command to be executed
		if (opts.toConsole && !opts.onStdout && stdoutData == null) {
			console.log(">>> Will execute: " + fullCmd(cmd, a_args));
			if (cpOpts && cpOpts.cwd) {
				console.log("        from dir: " + cpOpts.cwd);
			}
		}

		var ps = cp.spawn.apply(cp, params);

		if (ps.stdout) {
			ps.stdout.on("data", (data) => {
				stdHandler(data, opts.onStdout, stdoutData);
			});
		}

		if (ps.stderr) {
			ps.stderr.on("data", (data) => {
				stdHandler(data, opts.onStderr, stderrData);
			});
		}


		ps.on('close', (code) => {
			if (!opts.ignoreFail && code !== 0) {
				reject(new Error(`Error executing ` + fullCmd(cmd, a_args)));
			} else {
				var r = { code: code };

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


function stdHandler(data, onStd, stdData) {

	// if we have a onStd... 
	if (onStd) {
		onStd(data);
	}

	// if we need to capture the data
	if (stdData != null) {
		stdData.push(data.toString());
	}

}


function fullCmd(cmd, args) {
	if (args) {
		cmd += " " + args.join(" ");
	}
	return cmd;
}


var spawnOptionNames = { "cwd": true, "env": true, "argv0": true, "stdio": true, "detached": true, "uid": true, "gid": true, "shell": true };
function extractCPOptions(opts) {
	if (!opts) {
		return;
	}

	var cpOpts = {};
	var hasVal = false;

	for (let key in opts) {
		if (spawnOptionNames[key]) {
			let v = opts[key];
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
	} catch (ex) {
		return false;
	}
}
// --------- /File Utils --------- //
