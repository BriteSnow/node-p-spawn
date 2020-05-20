import { deepStrictEqual as equal } from 'assert';
import * as fs from 'fs';
import { promisify } from 'util';
import { spawn } from '../../src/index';

const fsReadFile = promisify(fs.readFile);


var testOutDir = './test/out/test-tofile';

describe('spawn', function () {

	it('simple-echo', async () => {
		await spawn('echo', ['hello world'], { cwd: './test' });
	});

	it('onStdout-base', async () => {
		let txt: string | null = null;

		await spawn('echo', ['hello world'], {
			onStdout: (data) => {
				txt = data.toString();
			}
		});

		equal(txt!.trim(), 'hello world');
	});


	it('onStdout-cwd', async () => {
		let txt: string | null = null;

		await spawn('pwd', {
			cwd: './test',
			onStdout: (data) => {
				txt = data.toString().trim();
			}
		});

		equal(txt!.endsWith('test'), true, `should have ended with 'test' but was [${txt}]`);
	});


	it('onStdout-capture', async () => {

		const r = await spawn('echo', ['hello world'], { capture: 'stdout' });

		equal(r.stdout, 'hello world\n');
	});

	it("env", async () => {
		const r = await spawn('env', { capture: 'stdout', env: { ...process.env, AAA: 'aaa' } });
		equal(r.stdout?.includes('AAA=aaa'), true);
	});


	it('toFile', async () => {

		const logFile = './test/out/testToFile.log';
		const testContent = 'hello world from toFile test';
		await spawn('echo', [testContent], { toFile: logFile });

		const content = await fsReadFile(logFile, 'utf-8');
		equal(content.trim(), testContent);

	});

	it('capture-and-console', async () => {

		const r = await spawn('echo', ['hello world'], { capture: 'stdout', toConsole: true });

		equal(r.stdout, 'hello world\n');
	});

	it('fail', async () => {

		// Note: cannot use the assert.throws since for lack of Promise/Async support :(
		try {
			await spawn('not_a_command');
		} catch (e) {
			equal(e.toString().includes('ENOENT'), true, 'should be ENOENT');
			return;
		}

		throw new Error('should have thrown an exception');

	});


});

