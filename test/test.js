const assert = require("assert");
const spawn = require ("../index.js");


describe("spawn", function(){

	it("simple echo", async () => {
		await spawn("echo", ["hello world"]);
	});

	it("onStdout", async () => {
		var txt = null;

		await spawn("echo", ["hello world"], {
			onStdout: (data) => {
				txt = data.toString();
			}
		});

		assert.equal(txt.trim(), "hello world");
	});


	it("onStdout with cwd", async () => {
		var txt = null;

		await spawn("pwd", {
			cwd: "./test",
			onStdout: (data) => {
				txt = data.toString().trim();				
			}
		});

		assert(txt.endsWith("test"), `should have ended with 'test' but was [${txt}]`);
	});


	it("onStdout capture", async () => {

		var r = await spawn("echo", ["hello world"], {capture: "stdout"});

		assert.equal(r.stdout, "hello world");
	});


	it("fail test", async () => {

		// Note: cannot use the assert.throws since for lack of Promise/Async support :(
		try{
			await spawn("not_a_command");
		}catch(e){
			assert(e.toString().includes("ENOENT"));
			return;
		}

		throw new Error("should have thrown an exception");
		
	});


});

