/* Truthful BEST RUN adoption. Standalone UMD: browser <script> or CommonJS. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RunAdoption = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function finite(value) {
    value = Number(value);
    return Number.isFinite(value) ? value : 0;
  }

  function decide(input) {
    input = input || {};
    if (input.incomplete || input.legacy) return true;

    var oldBest = finite(input.oldBest);
    var newBest = finite(input.newBest);
    var oldAverage = finite(input.oldAverage);
    var newAverage = finite(input.newAverage);
    var oldRoles = Array.isArray(input.oldAssignedRoleScores) ? input.oldAssignedRoleScores : [];
    var newRoles = Array.isArray(input.newAssignedRoleScores) ? input.newAssignedRoleScores : [];

    if (oldRoles.length !== newRoles.length) return false;
    var groupSafe = oldRoles.every(function (score, index) {
      return finite(newRoles[index]) >= finite(score);
    });
    if (!groupSafe) return false;

    return newBest > oldBest || (newBest === oldBest && newAverage >= oldAverage);
  }

  return Object.freeze({ decide: decide });
});
