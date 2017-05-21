
Yet another spawn promise.

Promisified child_process.spawn, with more option, and stdout/stderr to console by default. 

```js
spawn(cmd, args, opts); // return Promise
```

Parameters: 

Promisified child_process.spawn, with more option, and stdout/stderr to console by default. 

- cmd {String}: (required) The command name e.g., "aws" 
- args {Array}: (optional) The array of argument string, without space. e.g., ["s3", "--profile", "dist", "sync", s3Path, tenantDir];
- opts:
  - toConsole {boolean}: (default true) If true, stdio: ["pipe", process.stdio, process.stderr] 
  - ignoreFail {boolean}: (default false) If true, the fail will not thrown an error just resolve with .code non 0
  - capture {string|array}: ["stdout","stderr"] if any of those set, it will get captured and returned (i.e. resolve as {stdout, stderr})
  - onStdout {fn(data)}: forward of the stdout.on("data") to this function. This will turn stdio stdout to the default 'pipe' and therefore not printed to console
  - onStderr {fn(data)}: forward of the stderr.on("data") to this function. This will turn stdio stderr to the default 'pipe' and therefore not printed to console
  - Any other child_process_options (https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options)
    - if .stdio is set, the it will take precedence on the above

Return promise that will resolve with the exit code, and the eventual .stdout and .stderr captures

Exception: will reject if we have a on("error") (except if opts.ignoreFail is set to true)

Return promise that will resolve with the exit code, and the eventual .stdout and .stderr captures

Exception: will reject if we have a on("error") (except if opts.ingoreFail is set to true)

Examples:

```js
const spawn = require("p-spawn");

// will console log the stdout and stderr
await spawn("echo", ["hello world"]);


// will not console log the stdout but rather to forward in onStdout
var txt = [];
await spawn("echo", ["hello world"], {
  onStdout: (data) => {
    txt.push(data.toString());
  }
});
console.log(txt.join("\n"));

// we an pass spawn options as well
await spawn("pwd", {
  cwd: "./test",
  onStdout: (data) => {
    txt.push(data.toString());
  }
});

// we an pass spawn options as well
var result = await spawn("echo",["hello world"], {capture: "stdout"});

console.log(result.stdout); // "hello world"


```
