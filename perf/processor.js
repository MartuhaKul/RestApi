'use strict';

let counter = 0;

function generateUserPayload(context, _events, done) {
  counter += 1;
  const id = `${Date.now()}-${counter}-${Math.random().toString(36).slice(2, 8)}`;
  context.vars.testName = `Load Tester ${counter}`;
  context.vars.testEmail = `lt-${id}@example.com`;
  context.vars.testAge = 20 + (counter % 50);
  return done();
}

module.exports = { generateUserPayload };
