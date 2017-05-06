const cp = require("child_process");


module.exports = p_spawn;


var defaultSpawnOpts = {
	toConsole: true
};

// Call the child_process.spawn and output the stdout in the console by default. 
// Note: should be used rather than the exec for all sh
// - cmd {String}: (required) The command name e.g., "aws" 
// - args {Array}: (required) The array of argument string, without space. e.g., ["s3", "--profile", "dist", "sync", s3Path, tenantDir];
// - opts:
//   - toConsole {boolean}: (default true). If true, stdout.on("data" and stderr.on("data" are printed to the console.log
//   - onStdout {fn(data)}: forward of the stdout.on("data" to this function (same data passed). This will turn off console.log for stdout
//   - onStderr {fn(data)}: forward of the stderr.on("data" to this function (same data passed). This will turn off console.log for stderr
//
// Return promise that will resolve with the exit code.
// Exception: will reject if we have a on("error")
function p_spawn(cmd, args, opts){
	opts = Object.assign({}, defaultSpawnOpts,opts);
	return new Promise(function(resolve, reject){
		var ps = cp.spawn(cmd, args);
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
				reject(`Error executing ${cmd} ${args.join(" ")}`);
			}else{
				resolve(code);
			}
		});

		ps.on("error", (err) => {
			reject(err);
		});
	});
}