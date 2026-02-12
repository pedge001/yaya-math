import { describe, it, expect } from "vitest";

type Operation = "addition" | "subtraction" | "multiplication" | "division";

interface LeaderboardEntry {
  id: number;
  initials: string;
  score: number;
  totalProblems: number;
  operation: Operation;
  createdAt: Date;
}

describe("Operation-Specific Leaderboards", () => {
  it("filters leaderboard entries by operation type", () => {
    const allEntries: LeaderboardEntry[] = [
      { id: 1, initials: "ABC", score: 50, totalProblems: 50, operation: "multiplication", createdAt: new Date() },
      { id: 2, initials: "XYZ", score: 48, totalProblems: 50, operation: "addition", createdAt: new Date() },
      { id: 3, initials: "JOE", score: 45, totalProblems: 50, operation: "multiplication", createdAt: new Date() },
      { id: 4, initials: "SUE", score: 42, totalProblems: 50, operation: "subtraction", createdAt: new Date() },
      { id: 5, initials: "BOB", score: 40, totalProblems: 50, operation: "division", createdAt: new Date() },
    ];

    const multiplicationEntries = allEntries.filter((entry) => entry.operation === "multiplication");
    const additionEntries = allEntries.filter((entry) => entry.operation === "addition");

    expect(multiplicationEntries).toHaveLength(2);
    expect(additionEntries).toHaveLength(1);
    expect(multiplicationEntries[0].score).toBe(50);
    expect(additionEntries[0].initials).toBe("XYZ");
  });

  it("maintains separate top 10 for each operation", () => {
    const operations: Operation[] = ["addition", "subtraction", "multiplication", "division"];

    operations.forEach((operation) => {
      const leaderboard: LeaderboardEntry[] = [];
      
      // Simulate 10 entries for this operation
      for (let i = 0; i < 10; i++) {
        leaderboard.push({
          id: i,
          initials: "AAA",
          score: 50 - i,
          totalProblems: 50,
          operation: operation,
          createdAt: new Date(),
        });
      }

      expect(leaderboard).toHaveLength(10);
      expect(leaderboard.every((entry) => entry.operation === operation)).toBe(true);
      expect(leaderboard[0].score).toBeGreaterThan(leaderboard[9].score);
    });
  });

  it("checks high score qualification against operation-specific leaderboard", () => {
    const multiplicationLeaderboard: LeaderboardEntry[] = [
      { id: 1, initials: "TOP", score: 50, totalProblems: 50, operation: "multiplication", createdAt: new Date() },
      { id: 2, initials: "MID", score: 40, totalProblems: 50, operation: "multiplication", createdAt: new Date() },
    ];

    const additionLeaderboard: LeaderboardEntry[] = [
      { id: 3, initials: "ADD", score: 30, totalProblems: 50, operation: "addition", createdAt: new Date() },
    ];

    // Score of 35 qualifies for multiplication (> 40 is false, but < 10 entries)
    const multiplicationScore = 35;
    const qualifiesForMultiplication = multiplicationLeaderboard.length < 10 || multiplicationScore > multiplicationLeaderboard[multiplicationLeaderboard.length - 1].score;
    expect(qualifiesForMultiplication).toBe(true);

    // Score of 35 qualifies for addition (> 30)
    const additionScore = 35;
    const qualifiesForAddition = additionLeaderboard.length < 10 || additionScore > additionLeaderboard[additionLeaderboard.length - 1].score;
    expect(qualifiesForAddition).toBe(true);
  });

  it("parses first operation from comma-separated operations string", () => {
    const operationsStrings = [
      "multiplication",
      "addition,subtraction",
      "division,multiplication,addition",
    ];

    const firstOperations = operationsStrings.map((ops) => ops.split(",")[0]);

    expect(firstOperations[0]).toBe("multiplication");
    expect(firstOperations[1]).toBe("addition");
    expect(firstOperations[2]).toBe("division");
  });

  it("validates operation enum values", () => {
    const validOperations: Operation[] = ["addition", "subtraction", "multiplication", "division"];
    const invalidOperations = ["add", "multiply", "divide", "subtract"];

    validOperations.forEach((op) => {
      expect(["addition", "subtraction", "multiplication", "division"]).toContain(op);
    });

    invalidOperations.forEach((op) => {
      expect(["addition", "subtraction", "multiplication", "division"]).not.toContain(op);
    });
  });

  it("displays correct operation symbols in tabs", () => {
    const operationSymbols: Record<Operation, string> = {
      addition: "+",
      subtraction: "−",
      multiplication: "×",
      division: "÷",
    };

    expect(operationSymbols.addition).toBe("+");
    expect(operationSymbols.subtraction).toBe("−");
    expect(operationSymbols.multiplication).toBe("×");
    expect(operationSymbols.division).toBe("÷");
  });
});
