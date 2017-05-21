const cp = require("child_process");


module.exports = p_spawn;


var defaultSpawnOpts = {
	toConsole: true
};

// Promisified child_process.spawn, with more option, and stdout/stderr to console by default. 
// 
// - cmd {String}: (required) The command name e.g., "aws" 
// - args {Array}: (optional) The array of argument string, without space. e.g., ["s3", "--profile", "dist", "sync", s3Path, tenantDir];
// - opts:
//   - toConsole {boolean}: (default true) If true, stdio: ["pipe", process.stdio, process.stderr] 
//   - ignoreFail {boolean}: (default false) If true, the fail will not thrown an error just resolve with .code non 0
//   - capture {string|array}: ["stdout","stderr"] if any of those set, it will get captured and returned (i.e. resolve as {stdout, stderr})
//   - onStdout {fn(data)}: forward of the stdout.on("data") to this function. This will turn stdio stdout to the default 'pipe' and therefore not printed to console
//   - onStderr {fn(data)}: forward of the stderr.on("data") to this function. This will turn stdio stderr to the default 'pipe' and therefore not printed to console
//   - Any other child_process_options (https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options)
//     - if .stdio is set, the it will take precedence on the above
// 
// Return promise that will resolve with the exit code, and the eventual .stdout and .stderr captures
// 
// Exception: will reject if we have a on("error") (except if opts.ignoreFail is set to true)
function p_spawn(cmd, a_args, a_opts){

	// get the eventual opts and build the spawn option
	var opts = (arguments.length === 3)?a_opts:a_args;
	opts = Object.assign({}, defaultSpawnOpts,opts);

	// build the spawn options
	var cpOpts = extractCPOptions(opts) || {};

	// make sure it is an array if defined
	var capture = (opts.capture && typeof opts.capture === "string")?[opts.capture]:opts.capture;
	var stdoutData = (capture && capture.includes("stdout"))?[]:null;
	var stderrData = (capture && capture.includes("stderr"))?[]:null;


	var stdout = "pipe", stderr = "pipe";

	// If we have toConsole and no capture and no onStd binding, we output to std
	if (opts.toConsole && !opts.onStdout && stdoutData == null){
		stdout = process.stdout;
	}

	// If we have toConsole and no capture and no onStd binding, we output to std
	if (opts.toConsole && !opts.onStderr && stderrData == null){
		stderr = process.stderr;
	}

	// the passed stdio will aways take precedence
	var stdio = cpOpts.stdio || ["pipe", stdout, stderr];
	cpOpts.stdio = stdio;


	return new Promise(function(resolve, reject){		

		// build the params list depending of what has been defined
		var params = [cmd];
		if (a_args){
			params.push(a_args);
		}
		if (cpOpts){
			params.push(cpOpts);
		}

		// if we have the toConsole for the stdout (and no capture), we print the command to be executed
		if (opts.toConsole && !opts.onStdout && stdoutData == null){
			console.log(">>> Will execute: " + fullCmd(cmd, a_args));			
			if (cpOpts && cpOpts.cwd){
				console.log("        from dir: " + cpOpts.cwd);
			}
		}


		var ps = cp.spawn.apply(cp, params);

		if (ps.stdout){
			ps.stdout.on("data", (data) => {
				stdHandler(data, opts.onStdout,  stdoutData);
			});			
		}

		if (ps.stderr){
			ps.stderr.on("data", (data) => {
				stdHandler(data, opts.onStderr,  stderrData);
			});			
		}


		ps.on('close', (code) => {
			if (!opts.ignoreFail && code !== 0){
				reject(new Error(`Error executing ` + fullCmd(cmd, a_args)));
			}else{
				var r = {code: code};

				if (stdoutData != null){
					r.stdout = stdoutData.join("");
				}
				if (stderrData != null){
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


function stdHandler(data, onStd, stdData){

	// if we have a onStd... 
	if (onStd){
		onStd(data);
	}

	// if we need to capture the data
	if (stdData != null){
		stdData.push(data.toString());
	}

}


function fullCmd(cmd, args){
	if (args){
		cmd += " " + args.join(" ");
	}
	return cmd;
}


var spawnOptionNames = {"cwd": true, "env": true, "argv0": true, "stdio": true, "detached": true, "uid": true, "gid": true, "shell": true};
function extractCPOptions(opts){
	if (!opts){
		return;
	}

	var cpOpts = {};
	var hasVal = false;

	for (let key in opts){
		if (spawnOptionNames[key]){
			let v = opts[key];
			if (v != null){
				hasVal = true;
				cpOpts[key] = v;
			}			
		}
	}
	
	if (hasVal){
		return cpOpts;
	}
}