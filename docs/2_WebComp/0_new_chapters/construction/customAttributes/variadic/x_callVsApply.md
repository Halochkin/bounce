#### What is the diffence between `apply` and `call`?

```javascript
function one(a){
  let sum = 0;
  for (let i = 0; i < arguments.length; i++)
    sum += arguments[i];
  return sum;
}

console.log(one(111,222,333));      //666 
```

In "classical" JS parameters are listed as parenthesis-enclosed comma-separated lists: `function one(a) {...` and `one(111,222,333)`. But, classical JS also offered an alternative `arguments`: a pointer to the arguments list itself. You can pass in many parameters.And, classical JS didn't stop you from *passing* more parameters than the function signature suggested.

This means that you in classical JS could send in and work with more arguments can make functions that work on indetermined parameter-length `arguments`.

For each invocation, there is an "outside list of" arguments: `(111,222,333)`. But this list itself is only *implied* by the syntax, not *explicit*; you don't have a variable that points to this list - there is no `outsideArguments` when you call a function in classical JS.


You can *always* send in more arguments to a function than is declared in its signature, and then the inside of the function can access them using `arguments`.

In JS, you can declare a function with only a fixed-parameter signature, and still pass it an indefinite list of arguments:

Put simply: when the JS interpreter invokes a function, it always `apply` that function to a list of arguments.




This is "fine". But this is "fine" not because "it feels right to us experts now". This is "fine" in the sense that this is the JS tradition. This was a choice JS made waaay back when. And that choice was also "fine" because kids have been taught to write and think about mathematical functions in this way for a long time. The "classical" JS way of writing functions has deep cultural roots, it's like the day having 24=2x12 hours.

The classical JS way of writing functions is what I call the `call` way. In the code text, the list of `arguments` passed into the function is only *implied* with parenthesis-lists such as `(111,222,333)`. We can call this list the "outsideArguments" list. The problem with the `call` way of writing functions is the syntax doesn't give you a reference/~variable~ to this "outsideArguments", which is the other side of the coin for the inside `arguments`. In old-school JS, you couldn't say: "dear function `one`, I have this list here with `outsideArguments`, and I would like that you treat this list as your inner `arguments` and give me the result".

That was limiting in many use-cases. And so ES2015 said "if you write three dots `...` before the last argument in the parenthesis list, the function will now treat that last argument as its inner `argument` when it runs. And, btw, you can use the same signature when you declare your function instead of the old `arguments`, if you'd like". Nice! This created a second *syntactic* way to invoke the function, the `apply` way.

```javascript
function one(...args){                    
  let sum = 0;
  for (let i = 0; i < args.length; i++)   
    sum += args[i];
  return sum;
}
const outsideArguments = [1,2,3];
console.log(one(...outsideArguments));  //6 
```

In one sense, the new `apply` way with its `...` is *technically deeper* than the old, classical JS `call` way. It more directly mirrors the way the JS interpreter runs internally. It exposes and directly links the inner `arguments`. This is not only nice, but it also has a consequence. This means that *any* JS function that can be `call`ed can also be `apply`ed: there are no use-cases/situations where you cannot either take a list, or make a new list with your variables/primitives, and then use `...` to `apply`-invoke any JS function. It might look stupid and wrong, but it should be technically and syntactically feasible in ES2015.

But. We can create functions that in certain situations we invoked the `call` way:
1. *iff your original source is a list* and
2. *iff you write your function in a particular quasi-variadic way* (like `assign()` and `replaceChildren()`), then
3. you must `apply`.

**If you can `call` a function you can also `apply` it. But not every function you can `apply` can also be `call`ed.**   