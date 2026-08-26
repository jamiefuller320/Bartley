import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { schoolOfferingLabel, schoolOfferingMeta } from "@/lib/schoolOffering";

describe("schoolOfferingLabel", () => {
  it("labels junior schools", () => {
    assert.equal(schoolOfferingLabel("7-11"), "Junior · KS2");
    assert.equal(schoolOfferingLabel("7 to 11"), "Junior · KS2");
  });

  it("labels primary schools", () => {
    assert.equal(schoolOfferingLabel("4-11"), "Primary · KS1+KS2");
    assert.equal(schoolOfferingLabel("5-11"), "Primary · KS1+KS2");
  });

  it("combines offering with school type", () => {
    assert.equal(
      schoolOfferingMeta("7-11", "Community school"),
      "Junior · KS2 · Community school",
    );
  });
});
