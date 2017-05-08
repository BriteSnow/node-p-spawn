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
//   - toConsole {boolean}: (default true). If true, stdout.on("data") and stderr.on("data") are printed to the console.log
//   - capture {string|array}: ["stdout","stderr"] if any of those set, it will get captured and returned (i.e. resolve as {stdout, stderr})
//   - onStdout {fn(data)}: forward of the stdout.on("data") to this function. This will turn off console.log for stdout
//   - onStderr {fn(data)}: forward of the stderr.on("data") to this function. This will turn off console.log for stderr
//   - Any other child_process_options (https://nodejs.org/api/child_process.html#child_process_options_stdio)
// 
// Return promise that will resolve with the exit code.
// Exception: will reject if we have a on("error")
function p_spawn(cmd, a_args, a_opts){

	// get the eventual opts and build the spawn option
	var opts = (arguments.length === 3)?a_opts:a_args;
	opts = Object.assign({}, defaultSpawnOpts,opts);

	// build the spawn options
	var cpOpts = extractCPOptions(opts);
	
	// make sure it is an array if defined
	var capture = (opts.capture && typeof opts.capture === "string")?[opts.capture]:opts.capture;


	var stdoutData = (capture && capture.includes("stdout"))?[]:null;
	var stderrData = (capture && capture.includes("stderr"))?[]:null;

	return new Promise(function(resolve, reject){

		

		// build the params list depending of what has been defined
		var params = [cmd];
		if (a_args){
			params.push(a_args);
		}
		if (cpOpts){
			params.push(cpOpts);
		}

		var ps = cp.spawn.apply(this, params);

		ps.stdout.on("data", (data) => {
			stdHandler(data, false, opts,  stdoutData);
		});

		ps.stderr.on("data", (data) => {
			stdHandler(data, true, opts,  stderrData);
		});

		ps.on('close', (code) => {
			if (code !== 0){
				reject(`Error executing ` + fullCmd(cmd, a_args));
			}else{
				var r = {code: code};

				if (stdoutData != null){
					r.stdout = stdoutData.join("\n");
				}
				if (stderrData != null){
					r.stderr = stderrData.join("\n");	
				}

				resolve(r);
			}
		});

		ps.on("error", (err) => {
			reject(err);
		});
	});
}


function stdHandler(data, isStderr, opts, stdData){
	var toConsole = opts.toConsole;

	var onStd = (isStderr)?opts.onStderr:opts.onStdout;

	// this will turn off the console output
	if (onStd){
		onStd(data);
		toConsole = false;
	}

	if (stdData != null){
		stdData.push(data.toString().trim());
		toConsole = false;
	}

	if (toConsole){
		let prefix = (isStderr)?"stderr: ":"";
		console.log(prefix + data.toString());
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