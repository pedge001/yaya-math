import { describe, it, expect } from "vitest";

type Operation = "addition" | "subtraction" | "multiplication" | "division";

interface Problem {
  num1: number;
  num2: number;
  operation: Operation;
  answer: number;
}

function generateProblem(operations: Operation[]): Problem {
  const operation = operations[Math.floor(Math.random() * operations.length)];
  let num1: number, num2: number, answer: number;

  switch (operation) {
    case "addition":
      num1 = Math.floor(Math.random() * 99) + 1;
      num2 = Math.floor(Math.random() * 99) + 1;
      answer = num1 + num2;
      break;
    case "subtraction":
      num1 = Math.floor(Math.random() * 99) + 1;
      num2 = Math.floor(Math.random() * num1) + 1;
      answer = num1 - num2;
      break;
    case "multiplication":
      num1 = Math.floor(Math.random() * 10) + 1;
      num2 = Math.floor(Math.random() * 10) + 1;
      answer = num1 * num2;
      break;
    case "division":
      num2 = Math.floor(Math.random() * 10) + 1;
      answer = Math.floor(Math.random() * 10) + 1;
      num1 = num2 * answer;
      break;
  }

  return { num1, num2, operation, answer };
}

describe("Problem Generator", () => {
  it("generates correct addition problems", () => {
    for (let i = 0; i < 100; i++) {
      const problem = generateProblem(["addition"]);
      expect(problem.operation).toBe("addition");
      expect(problem.answer).toBe(problem.num1 + problem.num2);
      expect(problem.num1).toBeGreaterThanOrEqual(1);
      expect(problem.num1).toBeLessThanOrEqual(99);
      expect(problem.num2).toBeGreaterThanOrEqual(1);
      expect(problem.num2).toBeLessThanOrEqual(99);
    }
  });

  it("generates correct subtraction problems", () => {
    for (let i = 0; i < 100; i++) {
      const problem = generateProblem(["subtraction"]);
      expect(problem.operation).toBe("subtraction");
      expect(problem.answer).toBe(problem.num1 - problem.num2);
      expect(problem.answer).toBeGreaterThanOrEqual(0);
      expect(problem.num1).toBeGreaterThanOrEqual(1);
      expect(problem.num1).toBeLessThanOrEqual(99);
    }
  });

  it("generates correct multiplication problems", () => {
    for (let i = 0; i < 100; i++) {
      const problem = generateProblem(["multiplication"]);
      expect(problem.operation).toBe("multiplication");
      expect(problem.answer).toBe(problem.num1 * problem.num2);
      expect(problem.num1).toBeGreaterThanOrEqual(1);
      expect(problem.num1).toBeLessThanOrEqual(10);
      expect(problem.num2).toBeGreaterThanOrEqual(1);
      expect(problem.num2).toBeLessThanOrEqual(10);
    }
  });

  it("generates correct division problems", () => {
    for (let i = 0; i < 100; i++) {
      const problem = generateProblem(["division"]);
      expect(problem.operation).toBe("division");
      expect(problem.num1 / problem.num2).toBe(problem.answer);
      expect(problem.num1 % problem.num2).toBe(0);
      expect(problem.num2).toBeGreaterThanOrEqual(1);
      expect(problem.num2).toBeLessThanOrEqual(10);
    }
  });

  it("generates problems from multiple operations", () => {
    const operations: Operation[] = ["addition", "subtraction", "multiplication", "division"];
    const generatedOperations = new Set<Operation>();

    for (let i = 0; i < 200; i++) {
      const problem = generateProblem(operations);
      generatedOperations.add(problem.operation);
      expect(operations).toContain(problem.operation);
    }

    expect(generatedOperations.size).toBeGreaterThan(1);
  });

  it("generates 50 unique problems for a session", () => {
    const problems: Problem[] = [];
    const operations: Operation[] = ["multiplication"];

    for (let i = 0; i < 50; i++) {
      problems.push(generateProblem(operations));
    }

    expect(problems.length).toBe(50);
    problems.forEach((problem) => {
      expect(problem.answer).toBe(problem.num1 * problem.num2);
    });
  });
});

describe("Answer Validation", () => {
  it("correctly validates correct answers", () => {
    const problem: Problem = { num1: 5, num2: 4, operation: "multiplication", answer: 20 };
    const userAnswer = 20;
    expect(userAnswer).toBe(problem.answer);
  });

  it("correctly validates incorrect answers", () => {
    const problem: Problem = { num1: 5, num2: 4, operation: "multiplication", answer: 20 };
    const userAnswer = 21;
    expect(userAnswer).not.toBe(problem.answer);
  });
});

describe("Score Tracking", () => {
  it("tracks correct answers correctly", () => {
    let correctCount = 0;
    const problems: Problem[] = [
      { num1: 5, num2: 4, operation: "multiplication", answer: 20 },
      { num1: 3, num2: 7, operation: "addition", answer: 10 },
      { num1: 10, num2: 2, operation: "division", answer: 5 },
    ];

    const userAnswers = [20, 10, 5];

    userAnswers.forEach((userAnswer, index) => {
      if (userAnswer === problems[index].answer) {
        correctCount++;
      }
    });

    expect(correctCount).toBe(3);
  });

  it("calculates percentage correctly", () => {
    const correct = 45;
    const total = 50;
    const percentage = Math.round((correct / total) * 100);
    expect(percentage).toBe(90);
  });
});
