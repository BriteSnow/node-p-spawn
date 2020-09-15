import cp, { ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { WriteStream } from 'tty';
import { promisify } from 'util';


// module.exports = { spawn: p_spawn };

const fsAccess = promisify(fs.access);
const fsMkdir = promisify(fs.mkdir);

var defaultSpawnOpts: Options = {
};

interface Options {
	/** The optional dir to execute the command */
	cwd?: string;
	/** (default true if no capture and no onStdout) If true stdio: ["pipe", process.stdio, process.stderr] */
	toConsole?: boolean;
	/** If set, the stdout and stderr will be forwarded to a file. If string, the folders will be created if needed, and the file will created as well (the old one will be deleted if present) */
	toFile?: string;
	/** (default false) If true, the fail will not thrown an error just resolve with .code non 0 */
	ignoreFail?: boolean;
	/** ["stdout","stderr"] if any of those set, it will get captured and returned (i.e. resolve as {stdout, stderr}) */
	capture?: string | string[];
	/** Optional input to be written to stdin */
	input?: string;
	/** forward of the stdout.on("data") to this function. This will turn stdio stdout to the default 'pipe' and therefore not printed to console */
	onStdout?: (data: any) => void;
	/** forward of the stderr.on("data") to this function. This will turn stdio stderr to the default 'pipe' and therefore not printed to console */
	onStderr?: (data: any) => void;

	shell?: boolean | string;

	/** 
	 *  Any other child_process_options (https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options) 
	 *  if .stdio is set, the it will take precedence on the above
	 */
	[key: string]: any;
}

interface Result {
	code: number;
	stdout?: string;
	stderr?: string;
}



/**
 * Execute a spawn and return the Promise<Result>
 * 
 * Usage: 
 * ```ts
 * const result = await spawn('echo', ['hello','world'], {capture: 'stdout'});
 * // result.stdout == "hello world"
 * ```
 */
export async function spawn(cmd: string): Promise<Result>;
export async function spawn(cmd: string, args: string[]): Promise<Result>;
export async function spawn(cmd: string, options: Options): Promise<Result>;
export async function spawn(cmd: string, args: string[], options: Options): Promise<Result>;
export async function spawn(cmd: string, arg_1?: string[] | Options, arg_2?: Options): Promise<Result> {
	return spawnCp(cmd, <any>arg_1, <any>arg_2)[0]; // widen type for passthrough
}

/**
 * Execute the a spawn and return a tupple [Promise<Result>, ChildProcess] for full control
 */
export function spawnCp(cmd: string): [Promise<Result>, ChildProcess];
export function spawnCp(cmd: string, args: string[]): [Promise<Result>, ChildProcess];
export function spawnCp(cmd: string, options: Options): [Promise<Result>, ChildProcess];
export function spawnCp(cmd: string, args: string[], options: Options): [Promise<Result>, ChildProcess];
export function spawnCp(cmd: string, arg_1?: string[] | Options, arg_2?: Options): [Promise<Result>, ChildProcess] {

	// get the eventual opts and build the spawn option
	const args: string[] | undefined = (arg_1 && arg_1 instanceof Array) ? arg_1 : undefined;
	const _opts: Options | undefined = (args) ? arg_2 : !(arg_1 instanceof Array) ? arg_1 : undefined;

	const opts: Options = Object.assign({}, defaultSpawnOpts, _opts);

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

	let stdout: string | number | WriteStream = "pipe";
	let stderr: string | number | WriteStream = "pipe";

	// Note: for now use the fs sync operation (should be fast anyway)
	if (opts.toFile) {
		opts.toConsole = false; // can only one or the other. 
		let toFileInfo = path.parse(opts.toFile);
		fs.mkdirSync(toFileInfo.dir);

		try {
			if (fs.statSync(opts.toFile).isFile()) {
				fs.unlinkSync(opts.toFile);
			}
		} catch (ex) { } // do nothing if does not exist


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
	cpOpts.shell = opts.shell;

	let ps: ChildProcess | undefined;

	const promise = new Promise<Result>(function (resolve, reject) {

		// build the params list depending of what has been defined
		// TODO: Needs to have the right types (still does not below with the cp.spawn.apply)
		const params: (string | readonly string[] | cp.SpawnOptionsWithoutStdio)[] = [cmd];
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

		// TODO: needs to fix the type to not have to cast to any
		ps = cp.spawn.apply(cp, params as any);

		if (opts?.input) {
			ps.stdin?.write(opts.input);
			ps.stdin?.end();
		}

		if (ps.stdout) {
			ps.stdout.on("data", (data: any) => {
				stdHandler(data, opts.onStdout, stdoutData, (opts.toConsole) ? process.stdout : null);
			});
		}

		if (ps.stderr) {
			ps.stderr.on("data", (data: any) => {
				stdHandler(data, opts.onStderr, stderrData, (opts.toConsole) ? process.stderr : null);
			});
		}


		ps.on('close', (code: number) => {
			if (!opts.ignoreFail && code !== 0) {
				reject(new Error(`ERROR - Exit code ${code} - for command: ` + fullCmd(cmd, args)));
			} else {
				const r: any = { code: code };

				if (stdoutData != null) {
					r.stdout = stdoutData.join("");
				}
				if (stderrData != null) {
					r.stderr = stderrData.join("");
				}

				resolve(r);
			}
		});

		ps.on("error", (err: any) => {
			reject(err);
		});
	});

	return [promise, ps!];
}


// TOOD: Need to type
function stdHandler(data: any, onStd: any, stdData: any, processStd: any) {
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


function fullCmd(cmd: string, args?: string[]) {
	if (args) {
		cmd += " " + args.join(" ");
	}
	return cmd;
}


const spawnOptionNames = { "cwd": true, "env": true, "argv0": true, "stdio": true, "detached": true, "uid": true, "gid": true, "shell": true };

function extractCPOptions(opts: Options) {
	if (!opts) {
		return;
	}

	// TODO: need to type
	const cpOpts: any = {};
	let hasVal = false;

	for (let key in opts) {
		if ((<any>spawnOptionNames)[key]) {
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
async function fsMkdirs(folderPath: string) {
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

async function fsExists(path: string) {
	try {
		await fsAccess(path);
		return true;
	} catch (ex) {
		return false;
	}
}
// --------- /File Utils --------- //
