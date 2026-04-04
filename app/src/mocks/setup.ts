import { beforeAll, afterEach, afterAll } from "vitest";
import { server } from "./server";

// MSW 서버 라이프사이클
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
