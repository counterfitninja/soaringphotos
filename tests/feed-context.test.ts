import assert from "node:assert/strict";
import test from "node:test";

// Pure-function unit tests for the feed-context authorization rules.
// The DB-backed getFeedContext is exercised via quickstart scenarios.

import {
  canManageFeed,
  isMember,
  membershipFeedIds,
  resolveSwitchTarget,
  type FeedContext,
  type FeedMembershipInfo,
} from "../lib/feed-context";

const memberships: FeedMembershipInfo[] = [
  { feedId: "feed-a", feedName: "Family", role: "manager" },
  { feedId: "feed-b", feedName: "Friends", role: "member" },
];

function ctx(overrides: Partial<FeedContext> = {}): FeedContext {
  return {
    user: { id: "u1", username: "sam", role: "member" },
    memberships,
    activeFeedId: "feed-a",
    viewMode: "feed",
    ...overrides,
  };
}

test("membershipFeedIds returns all membership feed ids", () => {
  assert.deepEqual(membershipFeedIds(ctx()), ["feed-a", "feed-b"]);
});

test("membershipFeedIds returns empty array with no memberships", () => {
  assert.deepEqual(membershipFeedIds(ctx({ memberships: [] })), []);
});

test("isMember matches only actual memberships", () => {
  assert.equal(isMember(memberships, "feed-a"), true);
  assert.equal(isMember(memberships, "feed-x"), false);
  assert.equal(isMember([], "feed-a"), false);
});

test("canManageFeed: global admin can manage any feed", () => {
  const admin = { id: "root", role: "admin" };
  assert.equal(canManageFeed(admin, [], "feed-a"), true);
  assert.equal(canManageFeed(admin, [], "feed-x"), true);
});

test("canManageFeed: manager only within own feed", () => {
  const member = { id: "u1", role: "member" };
  assert.equal(canManageFeed(member, memberships, "feed-a"), true); // manager of feed-a
  assert.equal(canManageFeed(member, memberships, "feed-b"), false); // plain member of feed-b
  assert.equal(canManageFeed(member, memberships, "feed-x"), false);
});

test("canManageFeed: plain member manages nothing", () => {
  const member = { id: "u2", role: "member" };
  const plain: FeedMembershipInfo[] = [{ feedId: "feed-b", feedName: "Friends", role: "member" }];
  assert.equal(canManageFeed(member, plain, "feed-b"), false);
});

test("resolveSwitchTarget accepts a membership feed", () => {
  const res = resolveSwitchTarget(ctx(), "feed-b");
  assert.deepEqual(res, { activeFeedId: "feed-b", feedViewMode: "feed" });
});

test("resolveSwitchTarget rejects feeds the user does not belong to", () => {
  const res = resolveSwitchTarget(ctx(), "feed-x");
  assert.ok("error" in res);
});

test("resolveSwitchTarget: 'all' requires at least two memberships", () => {
  assert.deepEqual(resolveSwitchTarget(ctx(), "all"), { feedViewMode: "all" });
  const single = ctx({ memberships: [memberships[0]] });
  const res = resolveSwitchTarget(single, "all");
  assert.ok("error" in res);
});

test("resolveSwitchTarget: zero memberships cannot switch anywhere", () => {
  const empty = ctx({ memberships: [], activeFeedId: null });
  assert.ok("error" in resolveSwitchTarget(empty, "feed-a"));
  assert.ok("error" in resolveSwitchTarget(empty, "all"));
});
