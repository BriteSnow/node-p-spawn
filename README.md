
Yet another spawn promise. (Zero dependency!)

- Promisified child_process.spawn, with more options
- stdout/stderr to console by default. 
- Route stdout or stderr to file.
- Can run spawn as detached (promise will return with handle)
- Typescript definitions


Notes: 
- Require node.js > 8.0 (if you need more support, log ticket)
- Warning: From 0.4.0 needs to be imported as `{ spawn }`

```js
import { spawn } from 'p-spawn'
// or `const {spawn } from 'p-spawn'

await spawn(cmd, args, opts); // return Promise
```

[doc](src/index.ts)

Examples:

```js
const { spawn } = require("p-spawn");


async function test(){
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
}

```

