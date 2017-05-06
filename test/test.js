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


});

