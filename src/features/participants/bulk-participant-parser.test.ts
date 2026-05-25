import { describe, expect, it } from "vitest";

import {
  getDuplicateBulkParticipantNames,
  prepareBulkParticipantCreate,
  parseBulkParticipantNames,
} from "./bulk-participant-parser";

describe("bulk participant parser", () => {
  it("parses comma-separated names", () => {
    expect(parseBulkParticipantNames("Person One, Person Two, Person Three")).toEqual([
      "Person One",
      "Person Two",
      "Person Three",
    ]);
  });

  it("trims whitespace and drops empty entries", () => {
    expect(parseBulkParticipantNames(" Person One, , Person Two ,, ")).toEqual([
      "Person One",
      "Person Two",
    ]);
  });

  it("also accepts line breaks from pasted office lists", () => {
    expect(
      parseBulkParticipantNames("Person One\nPerson Two\r\nPerson Three"),
    ).toEqual(["Person One", "Person Two", "Person Three"]);
  });

  it("finds duplicate pasted names case-insensitively", () => {
    expect(
      getDuplicateBulkParticipantNames([
        "Person One",
        "Person Two",
        "person one",
      ]),
    ).toEqual(["person one"]);
  });

  it("rejects names over the participant limit during create preparation", () => {
    const longName = "A".repeat(81);

    expect(() =>
      prepareBulkParticipantCreate({
        existingParticipants: [],
        names: [longName],
      }),
    ).toThrow("Participant name must be 80 characters or fewer.");
  });

  it("rejects existing participant duplicates before creating any rows", () => {
    expect(() =>
      prepareBulkParticipantCreate({
        existingParticipants: [{ displayName: "Person One", sortOrder: 0 }],
        names: ["Person Two", "person one"],
      }),
    ).toThrow("Another participant already uses that name: person one.");
  });

  it("rejects duplicate pasted names before creating any rows", () => {
    expect(() =>
      prepareBulkParticipantCreate({
        existingParticipants: [],
        names: ["Person One", "person one"],
      }),
    ).toThrow("Duplicate pasted participant: person one.");
  });

  it("continues sort order after existing participants", () => {
    expect(
      prepareBulkParticipantCreate({
        existingParticipants: [
          { displayName: "Existing One", sortOrder: 0 },
          { displayName: "Existing Two", sortOrder: 4 },
        ],
        names: ["Person One", "Person Two"],
      }),
    ).toEqual({
      names: ["Person One", "Person Two"],
      nextSortOrder: 5,
    });
  });
});
