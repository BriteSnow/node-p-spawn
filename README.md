
Yet another spawn promise.


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
```
