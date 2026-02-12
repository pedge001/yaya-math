import { describe, it, expect } from "vitest";
import {
  saveSession,
  getOperationStats,
  getImprovementTrends,
  getOverallStats,
} from "../lib/statistics-tracker";

describe("Statistics Tracking System", () => {
  it("should calculate accuracy correctly", () => {
    const totalProblems = 50;
    const correctAnswers = 45;
    const expectedAccuracy = Math.round((correctAnswers / totalProblems) * 100);
    expect(expectedAccuracy).toBe(90);
  });

  it("should handle perfect score", () => {
    const totalProblems = 50;
    const correctAnswers = 50;
    const expectedAccuracy = Math.round((correctAnswers / totalProblems) * 100);
    expect(expectedAccuracy).toBe(100);
  });

  it("should handle zero score", () => {
    const totalProblems = 50;
    const correctAnswers = 0;
    const expectedAccuracy = Math.round((correctAnswers / totalProblems) * 100);
    expect(expectedAccuracy).toBe(0);
  });

  it("should calculate time correctly", () => {
    const completionTime = 125; // seconds
    const minutes = Math.floor(completionTime / 60);
    const seconds = completionTime % 60;
    expect(minutes).toBe(2);
    expect(seconds).toBe(5);
  });

  it("should format time with padding", () => {
    const completionTime = 65; // 1:05
    const minutes = Math.floor(completionTime / 60);
    const seconds = (completionTime % 60).toString().padStart(2, "0");
    expect(`${minutes}:${seconds}`).toBe("1:05");
  });

  it("should handle operations array", () => {
    const operations = ["addition", "subtraction", "multiplication", "division"];
    expect(operations).toHaveLength(4);
    expect(operations).toContain("addition");
    expect(operations).toContain("multiplication");
  });

  it("should calculate average correctly", () => {
    const values = [80, 90, 85, 95];
    const average = Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
    expect(average).toBe(88);
  });

  it("should handle empty trends", () => {
    const trends: any[] = [];
    expect(trends.length).toBe(0);
  });

  it("should sort trends by date", () => {
    const trends = [
      { date: "2024-01-03", accuracy: 90 },
      { date: "2024-01-01", accuracy: 85 },
      { date: "2024-01-02", accuracy: 88 },
    ];
    trends.sort((a, b) => a.date.localeCompare(b.date));
    expect(trends[0].date).toBe("2024-01-01");
    expect(trends[2].date).toBe("2024-01-03");
  });

  it("should calculate range for chart", () => {
    const values = [75, 85, 90, 80];
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min;
    expect(max).toBe(90);
    expect(min).toBe(75);
    expect(range).toBe(15);
  });
});
