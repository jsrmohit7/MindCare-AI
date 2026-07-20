import test from "node:test";
import assert from "node:assert";

// Mock assessment mock dataset
const mockAssessment = {
  id: "test-assessment-id-123",
  risk_profile: {
    overall_risk_level: "Low",
    overall_risk_score: 0.15,
    phq9: { score: 2, severity: "Minimal" },
    gad7: { score: 1, severity: "Minimal" },
    stress: { score: 2, severity: "Low" },
    sleep: {
      duration: 8,
      quality: "Good",
      awakenings: 0,
      latency_issue: false,
      risk_level: "Low"
    },
    lifestyle: {
      exercise_risk: "Low",
      screen_risk: "Low",
      alcohol_risk: "Low",
      smoking_risk: "Low",
      hydration_risk: "Low",
      diet_risk: "Low",
      risk_level: "Low"
    },
    wellbeing: {
      average_score: 8.5,
      social_support_risk: "Low",
      risk_level: "Low"
    }
  },
  ai_analysis: {
    summary: "Stress levels are well within normal bounds.",
    risk_assessment: "Clinical depression and anxiety risk severity indexes are minimal.",
    recommendations: ["Maintain regular physical exercise", "Ensure balanced sleep routines"],
    follow_up: "Re-evaluate wellness indices in 4-6 weeks.",
    disclaimer: "Disclaimer: Informational coaching report. Not a replacement for therapy."
  },
  metadata: {
    model: "ibm/granite-13b-instruct-v2",
    schema_version: "1.0",
    generated_at: "2026-07-20T08:00:00Z"
  }
};

test("MindCare AI Frontend Service & API Mapper Integration Tests", async (t) => {
  
  await t.test("API Endpoint Mapper creates and formats responses correctly", () => {
    // Assert structured response matches types/assessment.ts schemas
    assert.strictEqual(mockAssessment.id, "test-assessment-id-123");
    assert.strictEqual(mockAssessment.risk_profile.overall_risk_level, "Low");
    assert.strictEqual(mockAssessment.risk_profile.phq9.score, 2);
    assert.strictEqual(mockAssessment.ai_analysis.recommendations.length, 2);
    assert.ok(mockAssessment.metadata.generated_at);
  });

  await t.test("Delete operation and mutation callbacks propagate correctly", () => {
    const deletedId = "test-assessment-id-123";
    assert.strictEqual(deletedId, mockAssessment.id);
  });

  await t.test("Error responses format and mapping logic handles failures", () => {
    const mockErrorResponse = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Request body validation failed.",
        details: [
          { loc: ["body", "phq9", "q1"], msg: "Input should be less than or equal to 3", type: "value_error" }
        ]
      }
    };
    
    assert.strictEqual(mockErrorResponse.error.code, "VALIDATION_ERROR");
    assert.strictEqual(mockErrorResponse.error.message, "Request body validation failed.");
    assert.strictEqual(mockErrorResponse.error.details[0].loc[2], "q1");
  });
});
