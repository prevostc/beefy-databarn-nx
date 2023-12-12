import { getLoggerFor } from "./logger";

describe("logger", () => {
  it("should create a logger", () => {
    const logger = getLoggerFor("test", "test");
    expect(logger).toBeDefined();
  });
});
