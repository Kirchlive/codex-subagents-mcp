import { describe, it, expect } from 'vitest';
import { execFile } from 'child_process';
import { join } from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

function frame(msg: Record<string, unknown>) {
  const json = JSON.stringify(msg);
  const body = Buffer.from(json, 'utf8');
  const header = `Content-Length: ${body.length}\r\n\r\n`;
  return header + json;
}

function parseFrames(output: string): string[] {
  const frames: string[] = [];
  let remaining = output;
  while (remaining.length > 0) {
    const crlfIdx = remaining.indexOf('\r\n\r\n');
    const lfIdx = remaining.indexOf('\n\n');
    let headerEnd = -1;
    let sepLen = 0;
    if (crlfIdx !== -1 && (lfIdx === -1 || crlfIdx < lfIdx)) {
      headerEnd = crlfIdx;
      sepLen = 4;
    } else if (lfIdx !== -1) {
      headerEnd = lfIdx;
      sepLen = 2;
    } else {
      break;
    }
    const header = remaining.slice(0, headerEnd);
    const match = /Content-Length:\s*(\d+)/i.exec(header);
    if (!match) {
      remaining = remaining.slice(headerEnd + sepLen);
      continue;
    }
    const len = parseInt(match[1], 10);
    const start = headerEnd + sepLen;
    const body = remaining.slice(start, start + len);
    if (body.length < len) break;
    frames.push(body);
    remaining = remaining.slice(start + len);
  }
  return frames;
}

describe('MCP framing (initialize, tools/list)', () => {
  it('responds to framed initialize and tools/list', async () => {
    const bin = join(process.cwd(), 'dist', 'codex-subagents.mcp.js');
    const frames =
      frame({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }) +
      frame({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
    const { stdout } = await execFileAsync(
      'bash',
      ['-lc', `printf %s "$FRAMES" | node ${JSON.stringify(bin)}`],
      { env: { ...process.env, FRAMES: frames } },
    );
    const bodies = parseFrames(stdout);
    const responses = bodies
      .map((body) => {
        try {
          return JSON.parse(body) as Record<string, unknown>;
        } catch {
          return null;
        }
      })
      .filter((item): item is Record<string, unknown> => Boolean(item));
    const init = responses.find((msg) => 'id' in msg && (msg.id as number) === 1) as { result?: { serverInfo?: { name?: string } } } | undefined;
    expect(init?.result?.serverInfo?.name).toBeDefined();
    const list = responses.find((msg) => 'id' in msg && (msg.id as number) === 2) as { result?: { tools?: Array<{ name: string }> } } | undefined;
    const toolNames = (list?.result?.tools ?? []).map((t) => t.name);
    expect(toolNames).toEqual(expect.arrayContaining(['delegate', 'list_agents', 'validate_agents']));
  });
});
