import * as assert from 'assert'
import * as fs from 'fs'
import { spawn } from '../src/index'
import { promisify } from 'util'

const fsReadFile = promisify(fs.readFile);


var testOutDir = "./test/out/test-tofile";

describe("spawn", function () {

	it("simple echo", async () => {
		await spawn("echo", ["hello world"], { cwd: "./test" });
	});

	it("onStdout", async () => {
		let txt: string | null = null;

		await spawn("echo", ["hello world"], {
			onStdout: (data) => {
				txt = data.toString();
			}
		});

		assert.equal(txt!.trim(), "hello world");
	});


	it("onStdout with cwd", async () => {
		let txt: string | null = null;

		await spawn("pwd", {
			cwd: "./test",
			onStdout: (data) => {
				txt = data.toString().trim();
			}
		});

		assert(txt!.endsWith("test"), `should have ended with 'test' but was [${txt}]`);
	});


	it("onStdout capture", async () => {

		const r = await spawn("echo", ["hello world"], { capture: "stdout" });

		assert.equal(r.stdout, "hello world\n");
	});


	it("toFile", async () => {

		const logFile = "./test/out/testToFile.log";
		const testContent = "hello world from toFile test";
		await spawn("echo", [testContent], { toFile: logFile });

		const content = await fsReadFile(logFile, "utf-8");
		assert.equal(content.trim(), testContent);

	});

	it("capture-and-console", async () => {

		const r = await spawn("echo", ["hello world"], { capture: "stdout", toConsole: true });

		assert.equal(r.stdout, "hello world\n");
	});

	it("fail test", async () => {

		// Note: cannot use the assert.throws since for lack of Promise/Async support :(
		try {
			await spawn("not_a_command");
		} catch (e) {
			assert(e.toString().includes("ENOENT"));
			return;
		}

		throw new Error("should have thrown an exception");

	});


});

