import { Bool, Field } from 'o1js';

// docs:start includes-wrong
// WRONG: Array.includes() compares objects, not values. Two Field objects
// are never the same object, so the result is false.
export function includesWrong(list: Field[], x: Field): boolean {
  return list.includes(x);
}

// WRONG: equals() returns a Bool object, and JavaScript treats every object as
// true. The result is true for each list that is not empty.
export function includesWithSomeWrong(list: Field[], x: Field): boolean {
  return list.some((item) => item.equals(x));
}
// docs:end includes-wrong

// docs:start includes-right
// Compare x with each item and combine the results with or().
// The result is a Bool variable, so the circuit can use it.
export function includes(list: Field[], x: Field): Bool {
  return list.reduce((found, item) => found.or(item.equals(x)), Bool(false));
}
// docs:end includes-right
