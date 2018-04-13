

interface Options {
	/** The optional dir to execute the command */
	cwd?: string;
	/** (default true) If true, stdio: ["pipe", process.stdio, process.stderr] */
	toConsole?: boolean;
	/** If set, the stdout and stderr will be forwarded to a file. If string, the folders will be created if needed, and the file will created as well (the old one will be deleted if present) */
	toFile?: string;
	/** (default false) If true, the fail will not thrown an error just resolve with .code non 0 */
	ignoreFail?: boolean;
	/** ["stdout","stderr"] if any of those set, it will get captured and returned (i.e. resolve as {stdout, stderr}) */
	capture?: string | string[];
	/** forward of the stdout.on("data") to this function. This will turn stdio stdout to the default 'pipe' and therefore not printed to console */
	onStdout?: (data: any) => void;
	/** forward of the stderr.on("data") to this function. This will turn stdio stderr to the default 'pipe' and therefore not printed to console */
	onStderr?: (data: any) => void;
	/** Any other child_process_options (https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options) 
	 *  if .stdio is set, the it will take precedence on the above
	*/
	[key: string]: any;
}

/**
 * @returReturn promise that will resolve with the exit code, and the eventual .stdout and .stderr captures
 * Return promise that will resolve with the exit code, and the eventual .stdout and .stderr captures
 * 
 * Exception: will reject if we have a on("error") (except if opts.ignoreFail is set to true)
 * 
 * @param cmd same as node spawn cmd
 * @param args same as node spawn args
 * @param opts enhanced spawn opts
 */
// FIXME: need to defined the returned
export function spawn(cmd: string, args?: string[], opts?: Options): Promise<any>