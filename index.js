const cp = require("child_process");


module.exports = p_spawn;


var defaultSpawnOpts = {
	toConsole: true
};

// Call the child_process.spawn and output the stdout in the console by default. 
// Note: should be used rather than the exec for all sh
// - cmd {String}: (required) The command name e.g., "aws" 
// - args {Array}: (optional) The array of argument string, without space. e.g., ["s3", "--profile", "dist", "sync", s3Path, tenantDir];
// - opts:
//   - toConsole {boolean}: (default true). If true, stdout.on("data" and stderr.on("data" are printed to the console.log
//   - onStdout {fn(data)}: forward of the stdout.on("data" to this function (same data passed). This will turn off console.log for stdout
//   - onStderr {fn(data)}: forward of the stderr.on("data" to this function (same data passed). This will turn off console.log for stderr
//   - Any other child_process_options (https://nodejs.org/api/child_process.html#child_process_options_stdio)
// 
// Return promise that will resolve with the exit code.
// Exception: will reject if we have a on("error")
function p_spawn(cmd, a_args, a_opts){

	// get the eventual opts and build the spawn option
	var opts = (arguments.length === 3)?a_opts:a_args;
	opts = Object.assign({}, defaultSpawnOpts,opts);
	var cpOpts = extractCPOptions(opts);
	
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
			if (opts.onStdout){
				opts.onStdout(data);
			}else if (opts.toConsole){
				console.log(data.toString());
			}			
		});

		ps.stderr.on("data", (data) => {
			if (opts.onStderr){
				opts.onStderr(data);
			}else if (opts.toConsole){
				console.log("\nstderr: " + data.toString() + "\n");
			}				
		});

		ps.on('close', (code) => {
			if (code !== 0){
				reject(`Error executing ` + fullCmd(cmd, a_args));
			}else{
				resolve(code);
			}
		});

		ps.on("error", (err) => {
			reject(err);
		});
	});
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