
Yet another spawn promise. (Zero dependency!)

Promisified child_process.spawn, with more option, and stdout/stderr to console by default. 

NOTE: REQUIRE node.js > 8.0 (if you need more support, log ticket)


```js
spawn(cmd, args, opts); // return Promise
```

**Parameters:** 

Promisified child_process.spawn, with more option, and stdout/stderr to console by default. 

- cmd {String}: (required) The command name e.g., "aws" 
- args {Array}: (optional) The array of argument string, without space. e.g., ["s3", "--profile", "dist", "sync", s3Path, tenantDir];
- opts:
  - toConsole {boolean}: (default true) If true, stdio: ["pipe", process.stdio, process.stderr]
  - toFile: {string} If set, the stdout and stderr will be forwarded to a file. If string, the folders will be created if needed, and the file will created as well (the old one will be deleted if present)
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
const pspawn = require("p-spawn");


async function test(){
  // will console log the stdout and stderr
  await pspawn("echo", ["hello world"]);


  // will not console log the stdout but rather to forward in onStdout
  var txt = [];
  await pspawn("echo", ["hello world"], {
    onStdout: (data) => {
      txt.push(data.toString());
    }
  });
  console.log(txt.join("\n"));

  // we an pass pspawn options as well
  await pspawn("pwd", {
    cwd: "./test",
    onStdout: (data) => {
      txt.push(data.toString());
    }
  });

  // we an pass pspawn options as well
  var result = await pspawn("echo",["hello world"], {capture: "stdout"});

  console.log(result.stdout); // "hello world"  
}



```

