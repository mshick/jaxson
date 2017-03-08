const test = require('ava');
const jaxson = require('../index');
const complexReversible = require('./complex-reversible.json');
const complexIrreversible = require('./complex-irreversible.json');
const simpleReversible = require('./simple-reversible.json');
const simpleIrreversible = require('./simple-irreversible.json');
const source = require('./source.json');
const sourceIrreversible = require('./source-irreversible.json');
const target = require('./target.json');

test('simple test', t => {
  const result = jaxson(source, simpleReversible);
  t.deepEqual(result, {first_name: 'Michael', last_name: 'Shick'});
});

test('irreversible throws when reversed', t => {
  t.throws(() => {
    jaxson(source, simpleIrreversible, {reverse: true});
  });
});

// test('complex irreversible works', t => {
//   const result = mapic(source, complexIrreversible);
//   console.log(result);
//   const result2 = mapic(result, complexReversible, {reverse: true});
//   // console.log(result2);
//   t.deepEqual(result2, sourceIrreversible);
// });

test('complex map source to target', t => {
  const result = jaxson(source, complexReversible);
  t.deepEqual(result, target);
});

test('complex reverse map target to source', t => {
  const result = jaxson(target, complexReversible, {reverse: true});
  t.deepEqual(result, source);
});
