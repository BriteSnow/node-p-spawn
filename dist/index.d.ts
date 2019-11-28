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
    /** forward of the stdout.on("data") to this function. This will turn stdio stdout to the default 'pipe' and therefore not printed to console */
    onStdout?: (data: any) => void;
    /** forward of the stderr.on("data") to this function. This will turn stdio stderr to the default 'pipe' and therefore not printed to console */
    onStderr?: (data: any) => void;
    /** Any other child_process_options (https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options)
     *  if .stdio is set, the it will take precedence on the above
    */
    [key: string]: any;
}
export declare function spawn(cmd: string): Promise<any>;
export declare function spawn(cmd: string, args: string[]): Promise<any>;
export declare function spawn(cmd: string, options: Options): Promise<any>;
export declare function spawn(cmd: string, args: string[], options: Options): Promise<any>;
export {};
