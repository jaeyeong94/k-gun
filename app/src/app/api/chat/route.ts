import { spawn } from "child_process";

const MAX_PROMPT_LENGTH = 4000;

function sanitizePrompt(input: string): string {
  return input
    .slice(0, MAX_PROMPT_LENGTH)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ""); // control chars 제거
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return Response.json({ error: "메시지가 필요합니다" }, { status: 400 });
    }

    const sanitized = sanitizePrompt(message);
    if (sanitized.trim().length === 0) {
      return Response.json({ error: "유효한 메시지가 아닙니다" }, { status: 400 });
    }

    const result = await runClaude(sanitized);
    return Response.json({ result });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Claude Code 실행 실패";
    return Response.json({ error: msg }, { status: 500 });
  }
}

function runClaude(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const errChunks: Buffer[] = [];

    const proc = spawn("claude", ["-p", prompt, "--output-format", "text"], {
      cwd: process.cwd().replace("/app", ""),
      env: { ...process.env, CLAUDE_CODE_ENTRYPOINT: "k-gun-api" },
      timeout: 120_000,
    });

    proc.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    proc.stderr.on("data", (chunk: Buffer) => errChunks.push(chunk));

    proc.on("close", (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks).toString("utf-8"));
      } else {
        const stderr = Buffer.concat(errChunks).toString("utf-8");
        reject(new Error(`Claude 종료 코드 ${code}: ${stderr.slice(0, 500)}`));
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`Claude 실행 실패: ${err.message}`));
    });
  });
}
