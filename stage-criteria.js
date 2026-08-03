/* Dream Group stage judging criteria. Standalone UMD for browser and Node tests. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.StageCriteria = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function effectiveFields(fields, runDirection) {
    var base = Array.isArray(fields) ? fields.filter(Boolean) : [];
    var out = base.filter(function (field, index) { return base.indexOf(field) === index; });
    if (!runDirection || out.indexOf(runDirection) >= 0) return out;
    if (!out.length) return [runDirection];
    out[out.length - 1] = runDirection;
    return out.filter(function (field, index) { return out.indexOf(field) === index; });
  }

  return Object.freeze({ effectiveFields: effectiveFields });
});
