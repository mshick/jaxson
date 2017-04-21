const assert = require('assert');
const moment = require('moment');
const get = require('lodash/get');
const set = require('lodash/set');
const setWith = require('lodash/setWith');
const isUndefined = require('lodash/isUndefined');
const isNull = require('lodash/isNull');
const castArray = require('lodash/castArray');
const isString = require('lodash/isString');
const toString = require('lodash/toString');
const isNumber = require('lodash/isNumber');
const toNumber = require('lodash/toNumber');
const isArray = require('lodash/isArray');
const zipObject = require('lodash/zipObject');
const keys = require('lodash/keys');
const isEmpty = require('lodash/isEmpty');
const isObject = require('lodash/isObject');
const isObjectLike = require('lodash/isObjectLike');
const reduce = require('lodash/reduce');
const each = require('lodash/each');
const map = require('lodash/map');
const isFunction = require('lodash/isFunction');

const EMPTY_ARR_RE = /\[\]/g;
const LEADING_DOT_RE = /^\./;

function mirror(k) {
  k = isArray(k) ? k : keys(k);
  return reduce(k, (r, v) => {
    r[v] = v;
    return r;
  }, {});
}

function coerceType({value, type}) {
  if (isObject(value)) {
    return each(value, val => coerceType({value: val, type}));
  }

  switch(type) {
    case 'string':
      value = toString(value);
      break;
    case 'number':
      value = toNumber(value);
      break;
    case 'null':
      value = null;
      break;
    case 'boolean':
      if (isString(value)) {
        value = (value === 'true');
      } else if (isNumber(value)) {
        value = (value === 1);
      } else if (isObjectLike(value)) {
        value = !isEmpty(value);
      } else {
        value = Boolean(value);
      }
      break;
    case 'array':
      if (isArray(value)) {
        value = value;
      } else if (isObject(value)) {
        value = toPairs(value);
      } else if (isNull(value)) {
        value = [];
      } else {
        value = castArray(value);
      }
      break;
    case 'object':
      if (isObject(value) && !isArray(value)) {
        value = value;
      } else if (isString(value)) {
        value = JSON.parse(value);
      } else if (isNumber(value)) {
        value = mirror([value]);
      } else if (isArray(value)) {
        value = zipObject(keys(value), value);
      } else if (isNull(value)) {
        value = {};
      }
      break;
  }

  return value;
}

function formatDateTime({value, lPattern, rPattern}) {
  return moment.parseZone(value, lPattern).format(rPattern);
}

function getEmptyArr(obj, path) {
  let val;

  const parts = path.split('[]');

  each(parts, (p, pI) => {
    const p1 = p.replace(LEADING_DOT_RE, '');
    const p2 = parts[pI + 1] ? parts[pI + 1].replace(LEADING_DOT_RE, '') : null;
    if (!pI) {
      const p1Val = get(obj, p1);
      if (p1Val !== undefined) {
        val = map(p1Val, x => get(x, p2) ? get(x, p2) : null);
      }
    } else if (p2) {
      val = map(val, n => { return n ? get(n[0], p2) : null; });
    }
  });

  return val;
}

function setEmptyArr(obj, path, val) {
  const parts = path.split('[]');
  if (parts.length > 2) {
    // Multiple empties, we've lost too much index info to recreate
    each(parts, (p, pI) => {
      const p1 = p.replace(LEADING_DOT_RE, '');
      if (parts[pI + 1]) {
        pJ = parts.slice(0, pI + 1).join('[0]');
        set(obj, pJ, get(obj, pJ, []));
      }
    });
    set(obj, parts.join('[0]'), val);
  } else {
    set(obj, parts[0], get(obj, parts[0], []));
    each(val, (x, i) => {
      if (!isNull(x)) {
        set(obj, parts.join(`[${i}]`), x);
      }
    });
  }
}

function jaxson(source, mapObject, {reverse} = {}) {
  assert.ok(isObject(source));
  assert.ok(isObject(mapObject));

  const {isReversible, propertyMap} = mapObject;

  if (reverse) {
    assert.ok(isReversible, 'Attempting to reverse a non-reversible map');
  }

  let result = {};

  each(propertyMap, item => {
    let left = item[reverse ? 1 : 0];
    let right = item[reverse ? 0 : 1];

    if (isString(left)) {
      left = {key: left};
    } else if (isEmpty(left)) {
      left = {key: null};
    }

    const {
      key: lKey,
      type: lType,
      format: lFormat,
      pattern: lPattern,
      default: lDefault,
      transformValue: lTransformValue
    } = left;

    if (isString(right)) {
      right = {key: right};
    } else if (isEmpty(right)) {
      right = {key: null};
    }

    const {
      key: rKey,
      type: rType,
      format: rFormat,
      pattern: rPattern,
      default: rDefault,
      transformValue: rTransformValue
    } = right;

    let value;

    if (!rKey) {
      return;
    }

    if (lKey) {
      const emptyArrMatch = lKey.match(EMPTY_ARR_RE);
      if (emptyArrMatch) {
        if (isReversible) {
          assert.equal(emptyArrMatch.length, 1, 'isReversible is true, but multiple empty arrays set');
        }
        value = getEmptyArr(source, lKey);
      } else {
        value = get(source, lKey);
      }
    }

    if (isFunction(rTransformValue)) {
      value = rTransformValue({value, left, right, source});
    } else {
      if (!isUndefined(value)) {
        if (rType) {
          try {
            value = coerceType({value, type: rType});
          } catch(e) {
            console.warn('Value could not be coerced', item);
          }
        }

        if (rFormat === 'date-time') {
          try {
            value = formatDateTime({value, lPattern, rPattern});
          } catch(e) {
            console.warn('Value could not be formatted', item);
          }
        }
      }

      if (isUndefined(value)) {
        if (!isUndefined(rDefault)) {
          value = rDefault;
        } else {
          return;
        }
      }
    }

    if (isUndefined(value)) {
      return;
    }

    if (EMPTY_ARR_RE.test(rKey)) {
      setEmptyArr(result, rKey, value);
    } else {
      set(result, rKey, value);
    }
  });

  return result;
}

module.exports = jaxson;

module.exports.load = function (loadedMap, loadedOptions) {
  return function(source) {
    return jaxson(source, loadedMap, loadedOptions);
  };
};

module.exports.compile = function (loadedMap, loadedOptions) {
  return function(source) {
    return jaxson(source, loadedMap, loadedOptions);
  };
};
