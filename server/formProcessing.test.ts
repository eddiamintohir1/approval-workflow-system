import { describe, expect, it } from "vitest";
import {
  buildProcessingFields,
  deriveProcessingStatus,
  isMissingFormValue,
} from "./formProcessing";

describe("form processing", () => {
  it("treats empty values as missing without rejecting valid zero and false values", () => {
    expect(isMissingFormValue("")).toBe(true);
    expect(isMissingFormValue([])).toBe(true);
    expect(isMissingFormValue(0)).toBe(false);
    expect(isMissingFormValue(false)).toBe(false);
  });

  it("builds ordered mapped columns and missing-field labels", () => {
    const result = buildProcessingFields(
      [
        {
          id: "name",
          label: "Account Name",
          required: true,
          mappingKey: "account_name",
          showInTable: true,
          tableOrder: 2,
        },
        {
          id: "number",
          label: "Account Number",
          required: true,
          mappingKey: "account_number",
          showInTable: true,
          tableOrder: 1,
        },
      ],
      { number: "001234" }
    );

    expect(result.missingFields).toEqual([
      { id: "name", label: "Account Name" },
    ]);
    expect(result.mappedFields.map(field => field.key)).toEqual([
      "account_number",
      "account_name",
    ]);
  });

  it("prioritizes completed and draft statuses", () => {
    expect(
      deriveProcessingStatus({
        workflowCompleted: true,
        missingFieldCount: 2,
        submissionIsDraft: true,
        hasWorkflowProgress: false,
      })
    ).toBe("completed");

    expect(
      deriveProcessingStatus({
        workflowCompleted: false,
        missingFieldCount: 1,
        submissionIsDraft: true,
        hasWorkflowProgress: true,
      })
    ).toBe("draft");
  });

  it("distinguishes draft, ready, and in-progress forms", () => {
    expect(
      deriveProcessingStatus({
        workflowCompleted: false,
        missingFieldCount: 0,
        submissionIsDraft: true,
        hasWorkflowProgress: false,
      })
    ).toBe("draft");
    expect(
      deriveProcessingStatus({
        workflowCompleted: false,
        missingFieldCount: 1,
        submissionIsDraft: false,
        hasWorkflowProgress: false,
      })
    ).toBe("missing_info");
    expect(
      deriveProcessingStatus({
        workflowCompleted: false,
        missingFieldCount: 0,
        submissionIsDraft: false,
        hasWorkflowProgress: false,
      })
    ).toBe("ready");
    expect(
      deriveProcessingStatus({
        workflowCompleted: false,
        missingFieldCount: 0,
        submissionIsDraft: false,
        hasWorkflowProgress: true,
      })
    ).toBe("in_progress");
  });
});
