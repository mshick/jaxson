const test = require('ava');
const jaxson = require('../index');
const complexReversible = require('./fixtures/complex-reversible.json');
const complexIrreversible = require('./fixtures/complex-irreversible.json');
const simpleReversible = require('./fixtures/simple-reversible.json');
const simpleReversibleWithArray = require('./fixtures/simple-reversible-with-array.json');
const simpleIrreversible = require('./fixtures/simple-irreversible.json');
const source = require('./fixtures/source.json');
const sourceIrreversible = require('./fixtures/source-irreversible.json');
const target = require('./fixtures/target.json');
const mapWithTransform = require('./fixtures/transform');

test('simple test', t => {
  const result = jaxson(source, simpleReversible);
  t.deepEqual(result, {first_name: 'Michael', last_name: 'Shick'});
});

test('irreversible throws when reversed', t => {
  t.throws(() => {
    jaxson(source, simpleIrreversible, {reverse: true});
  });
});

test('complex map source to target', t => {
  const result = jaxson(source, complexReversible);
  t.deepEqual(result, target);
});

test('complex reverse map target to source', t => {
  const result = jaxson(target, complexReversible, {reverse: true});
  t.deepEqual(result, source);
});

test('transformValue function', t => {
  const result = jaxson(source, mapWithTransform);
  t.deepEqual(result, {name: "Michael Shick"});
});

test('mapping arrays when none exist does not lead to an empty array', t => {
  const result = jaxson(source, simpleReversibleWithArray);
  t.deepEqual(result, {first_name: 'Michael', last_name: 'Shick'});
});
