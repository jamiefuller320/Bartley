import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("printMonitorPack", () => {
  it("uses iframe print path without main-window visibility hacks", () => {
    const source = readFileSync(
      new URL("./printMonitorPack.ts", import.meta.url),
      "utf8",
    );
    assert.ok(!source.includes("monitor-print-active"));
    assert.ok(!source.includes("visibility: hidden"));
    assert.match(source, /printViaIframe/);
  });
});
