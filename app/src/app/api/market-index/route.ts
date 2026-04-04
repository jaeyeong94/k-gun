import { spawn } from "child_process";

const ALLOWED_COMMANDS = new Set(["index", "balance", "holdings", "all"]);

export async function GET() {
  try {
    const result = await runScript("index");
    let parsed;
    try {
      parsed = JSON.parse(result);
    } catch {
      return Response.json(
        { kospi: null, kosdaq: null, error: "응답 파싱 실패" },
        { status: 502 },
      );
    }
    return Response.json(parsed);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "지수 조회 실패";
    return Response.json(
      { kospi: null, kosdaq: null, error: msg },
      { status: 500 },
    );
  }
}

function runScript(cmd: string): Promise<string> {
  if (!ALLOWED_COMMANDS.has(cmd)) {
    return Promise.reject(new Error(`허용되지 않은 명령: ${cmd}`));
  }
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const projectRoot = process.cwd().replace(/\/app$/, "");
    const scriptPath = `${projectRoot}/.claude/scripts/api_client.py`;

    const proc = spawn("uv", ["run", scriptPath, cmd], {
      cwd: projectRoot,
      timeout: 15_000,
    });

    proc.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    proc.on("close", (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks).toString("utf-8"));
      } else {
        reject(new Error(`스크립트 종료 코드 ${code}`));
      }
    });
    proc.on("error", (err) => reject(err));
  });
}
