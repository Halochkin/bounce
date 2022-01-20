*This tutorial describes some good and bad design patterns for making variadic functions in JS. The tutorial sometimes follows a "simple first, expand later" principle. This should make for easy reading, but individual paragraphs may therefore not be 100% accurate on their own. Also, I try to be honest. I don't try to wrap my opinion is vague language. So, if you think I am wrong, you might very well be right.*

*And. This is work in progress. I just try to get it out asap as I fear our loved one, the DOM, has just been involved in a minor accident. I love you guys. All of you. Please [shoot down the message, not at the messenger](https://www.thisamericanlife.org/753/failure-to-communicate/act-one-1) :)*

# HowTo: use variadic functions in JS?

## 1. What does a variadic function look like?

Variadic functions *should* have **a variadic signature**. In ES6 a variadic signature is written using the rest operator `...`.

```javascript
function sum(...args) {
  let res = 0;
  for (let i = 0; i < args.length; i++)
    res += args[i];
  return res;
}
```

But. It *was* possible to declare variadic functions in classic JS syntax *before* ES6. These "old-school variadic functions" use the global `arguments` which gives access to the same indeterminate list of arguments and enable the same behavior.

```javascript
function sum(num1, num2) {      //classic JS
  let res = 0;
  for (let i = 0; i < arguments.length; i++)
    res += arguments[i];
  return res;
}
```

The problem with "old-school" variadic function declaration is that it didn't syntactically signal in the function signature that it is variadic and which arguments it has. It is therefore always preferable to declare variadic functions in ES6 syntax. Here, the syntax itself *explains* your function's intended use and behavior so you don't have to document it.

## 2. How to use a variadic function?

To invoke a variadic function, you need to pass it a list of arguments. This can be **written** in the code in two ways: the "call" and the "apply" way.

```javascript
//"call"ing the variadic function => 6
const a = sum(0, 2, 4);
//"apply"ing the variadic function => 6
const list = [1, 2, 3];
const b = sum(...list);               
```

The "call" way is the "normal" way. This is the way we learn to read and write simple mathematical functions in school; and this is the way we learn to use functions in programming. In JS, before ES6, this was also the *only* way we could invoke functions, except `Function.apply` and `new`.

The "apply" way is invoking a function and using the `...` on one or more of its parameters. In principle the JS run-time *always* invokes JS functions this "apply" way. Reading the JS script, the JS interpreter will a) find the object corresponding to the function reference, b) make a list of arguments, b2) which length it will never restrict, and finally c) pass the indeterminate-length arguments list to the function. That is also why variadic functions could be declared in classic JS since it had access to this special `arguments` list of any length.

> For most JS developers both "call"ing and "apply"ing is second nature. We do it all the time, like fish in water. But, at the same time, to "call" and "apply" are to different syntactic ways to invoke a function in JS. It is using verbs in different tenses: like if you do `[].push(1);` it's the equivalent of saying "I push one", while `[].push(...aList)` is like saying "I am pushing a list". Very similar, yet also very different. 

## 3. What does a variadic function look like inside?

Inside the variadic function there needs to be at least *two* things:

1. **A loop**, and
2. **an inner action** at step of the iteration.

Why always loop? Variadic functions don't know how many arguments it gets. It could be 2 or 2000. All these items should be processed, and the only feasable way to do that with 2000 items is to iterate over the list that holds them.

Why always an inner action? It is no point in making an iteration if we don't do anything at each step of that iteration.

## Anti-pattern "false-variadic"

To see why this should be considered a *rule*, and not the *norm*, we can do the opposite: For example, we can make a function with a variadic signature that doesn't loop:

```javascript
function notVariadic(...args) {
  return {
    can: args[0].we,
    do: args[1].this,
    sure: args[2].weCan,
    its: args[3].techincallyDoable
  }
}
```

Such a function looks rather dumb. Why didn't it instead make its signature `notVariadic(arg0, arg1, arg2, arg3)`? You could still use the spread operator on the outside. And what if you only passed in a list with 2 items? or 2000? The signature is confusing because it kinda suggests you should do that, it gives the wrong impression. So, no, this is not how it's done. If you don't iterate over the `...args`, then you shouldn't have a function signature that says that is going to happen. And if you do, then it is an anti-pattern that we can call "false-variadic".

## Anti-pattern "hot air iteration"

A variadic function with iteration only and no inner action looks dumb too. It produces nothing but air. Hot air from the processor:

```javascript
function hotAir(...args) {
  for (let i = 0; i < args.length; i++)
    "is the intended operation here to produce the heat equivalent of a flie flying?!";
}
```

## The contract of a variadic function 

The **variadic function** is therefore a contract that has two components:

1. an **external signature** that (strives) to signal that the function accepts a list of arguments of indeterminate length, and
2. an **internal structure** that **loops** over the argument and performs **an inner action** at each step, on those arguments.

I cannot stress the importance of this point. Variadic doesn't just mean external variadic signature, but also internal "variadic behavior". The point of the discussion is: what is good and bad variadic behavior? When should a variadic signature be used, and not?

## Pattern 1: static variadic functions

The `function plus(...args)` above is an example of a static variadic function. Static variadic functions is the simplest and best pattern for variadic functions. If there are no other compelling reasons for making your functions otherwise, then choose this pattern. It is good.

The static variadic function should be **pure**. The output should always be either a value or a new object or array. But, for performance reasons deep purity will often be skipped (ie. that if the function produce an object output, that object might contain objects that were arguments or parts of the argument). If "to-pure-or-not-pure" is a question troubling you, then your function is likely confronted with lots of both shallow and deep use-cases. You likely can't simply choose one over the other, you likely need to provide both. I would then recommend that you start making two different variadic methods, one shallow pure and one deep pure. And then, with these two variadic functions in hand, you can choose if you want to make them callable as one function using the fixed 'settings' arguments not unlike `.cloneNode(deep === true/false)`.

`String.fromCodePoint`, `Math.min`, `Math.max`, `Array.of` are four simple examples of static variadic functions with a pure loop **item by item**. Below is a naive rendition of how `Math.min` looks inside:

```javascript
window.Math = {};
Math.min = function min(...nums) {
  let min = Infinity;
  for (let n of nums)
    min = min > n ? n : min;
  return min;
}

Math.min(1, 2, 3, 4);      //1
Math.min(...[1, 2, 3, 4]); //1
``` 

## Pattern 2: variadic methods

A method is a function that is associated with an object. The methods/functions are associated with an object because it either reads or writes to the state of `this` object. And methods can also be variadic.

As with methods in general, I recommend the following guide for what a method should return:

1. the method returns an object of the same type as the object itself. This means that you can chain method calls, monad/jquery-style. Examples include `array.map().filter()` and `$( document.body).append("Hello", "<hr>").append("world")`.
2. the method primarily changes the state of the object, and signals that by returning void.
3. the method primarily reads and returns parts of the object's state.

There are many examples of variadic methods. Below is a naive rendition of `array.push()`:

```javascript
Array.prototype.push = function push(...args) { //1. the signature
  for (let item of args)                        //2. the loop
    this[this.length] = item;                   //3. the inner action
  //return undefined;                           //= variadic contract OK
};

const ar = [1, 2, 3];  //ar => [1,2,3]
ar.push(...[4, 5, 6]); //ar => [1,2,3,4,5,6]
```

## reverse variadic loops

`array.unshift()` is another interesting variadic method, because it uses a slightly different variadic loop: **item by item reverse**. 

```javascript
Array.prototype.unshift = function unshift(...args) { //1. signature
  for (let i = args.length - 1; i >= 0; i--) {        //2. the loop
    for (let i = this.length - 1; i >= 0; i--)        //3. inner action 
      this[i + 1] = this[i];                          //   inner action
    this[0] = args[i];                                //   inner action
  }
};

const ar = [1, 2, 3];     //ar => [1,2,3]
ar.unshift(...[4, 5, 6]); //ar => [4,5,6,1,2,3]
```

The above is a naive, inefficient implementation of `unshift`.  The purpose is to illustrate the variadic principle that governs the loop and the inner action.

## nested variadic loops

`DocumentFragment.append()` is a variadic method whose loop runs front to back, but that in addition will **recurse into nested sequences (documentFragment arguments) *one* level deep**. The recursion algorithm behaves not unlike `array.flat(1)`.

```javascript
const a = document.createDocumentFragment();
const b = document.createDocumentFragment();
const h1 = document.createElement('h1');
const h2 = document.createElement('h2');
b.append(h2);
console.log(b.childNodes); //[h2]
a.append(h1, b);           //`arguments` being something like [h1, {childNodes: [h2]}];
console.log(a.childNodes); //[h1, h2]
```

There are a couple of things that happen in this variadic method:

1. The arguments are "same typish". The variadic method doesn't only take an indetermined-length list of nodes, but an indetermined-length list with node&list-of-nodes.
2. This "same typishness" is part of the loop, not the inner action(!). It is the loop that will look at each argument coming in, see if it is an item or a nested sequence, and if it is a nested sequence recurse into it. The variadic loop is a pure function that can *both* iterate *and* resolve types.

This behavior is complex to code, but not necessarily complex to understand and use. I think most developers will find `array.flat()` understandable once explained well. We can illustrate that with a naive `Array_flattenDeep()`, a static, pure variadic function to recursively flatten an array:

```javascript
function* nestedIterator(ar) {
  for (let n of ar) {
    if (n instanceof Array)
      yield* nestedIterator(n);
    else
      yield n;
  }
}

function Array_flattenDeep(...itemOrNestedArray) {
  const res = [];
  for (let item of nestedIterator(itemOrNestedArray))
    res.push(item);
  return res;
}

Array_flattenDeep('h', ['ell', ['o'], ' '], 'world').join('');
```

In ES6 style, we can implement `Array_flattenDeep()` in a nicer(?) way, but a way that I found a little too dense for the example:

```javascript
function Array_flattenDeep(...itemOrNestedArray) {
  return [...nestedIterator(itemOrNestedArray)];
}
```

## The meaning of variadic loop extraction

Variadic loop extraction is best understood starting with an example:

```javascript
const ar1 = [1, 2, 3];
ar1.push(...[4, 5, 6]);  //inner action "apply"ed to list of elements
const ar2 = [1, 2, 3];

for (let n of [4, 5, 6]) //  =>  variadic loop extracted here  <=
  ar2.push(n);           //inner action "call"ed on individual items

console.log(ar1, ar2);   //[1,2,3,4,5,6], [1,2,3,4,5,6]
```

Ok. So we take the loop that happens inside the variadic function and then copy it/re-write it outside the variadic function. And then we call the same exact same variadic function on each element inside this new, outer loop. And the outcome is the same. Principally, this means that the variadic function can be *directly* applyed to a list, *and* we can manually loop over the list outside and "call" it sequentially. Ok. Now that's a trick! But. Is this trick a specific thing only with `push()`? Or does it apply "in general" to other variadic functions too?

`array.unshift()`? Yes.

```javascript
const ar1 = [1, 2, 3];
ar1.unshift(...[4, 5, 6]);  //ar1 => [4,5,6,1,2,3]
const ar2 = [1, 2, 3];
const four56 = [4, 5, 6];
for (let i = four56.length - 1; i >= 0; i--)
  ar2.unshift(four56[i]);//ar2 => [4,5,6,1,2,3]
```

`array.splice()`? Yes, but maybe it doesn't look super nice.

```javascript
const sequence = [1, 2, 3];
const target1 = [1, 2, 3];
const target2 = [1, 2, 3];
const target3 = [1, 2, 3];

//nice `apply` way
target1.splice(1, 1, ...sequence);

//the variadic loop extracted
for (let i = 0, position = 1, deleteCount = 1; i < sequence.length; i++, deleteCount = 0)
  target2.splice(position + i, deleteCount, sequence[i]);
//the deleteCount is a parameter passed into the loop, and 
//then from the loop to the innerAction.
//the state of loop has both position, counter, and deleteCount. *hairy*.  

//the normal way to imagine how splice() works 
target3.splice(1, 1);                            //delete first
for (let i = 0; i < sequence.length; i++)
  target3.splice(1 + i, 0, sequence[i]);         //then inject the element

console.log(target1, target2, target3);
```

## Non-extractable variadic loops

So, are all variadic loops extractable? Or are there some variadic functions where we *cannot* extract the loop? Yes. And they can look like this:

```javascript
class WeirdList {

  #list = [];

  push(...args) {
    this.#list = [];                //a
    for (let a of args)
      this.#list.push(a);
  }
}

const oops = new WeirdList();
oops.push(...[1, 2, 3]);           //#list = [1,2,3] 
const auch = new WeirdList();
for (let n of [1, 2, 3])
  auch.push(n);                  //#list = [3]
```

In this example a variadic `push()` method is provided. The inner loop of this `push()` method can be replicated outside where the method is invoked, but because the variadic method mutates the state *before* the loop, the outcome is *completely* different. And because the `#list` and the inner action of adding to that list is *not* invokable by any other methods, we cannot extract the inner loop. We can no longer split the variadic action on the list of elements into individual calls.

The secondary consequence of this, is that the *use* of `WeirdList` is now also **restricted** to the "apply" way of invoking the `push()` method. If the only thing you have is a variable pointing to a list, then you **must** use the spread operator to add it. The other patterns that we have looked at so far also benefits and encourages you to use the `...` operator. But, if you want, you **can always** extract the inner loop and "call" the variadic function as if it was its inner action only.

## But why is variadic extraction important?

1. **Usefull**. As in use-case-full: one function covers many and varied use-cases. Without being messy. For example, `array.push()` has an extractable loop. That means that you can "apply" it directly with `...` *and* decompose its behavior so as to combine your own inner actions to the mix, or make your own twist to the loop.

```javascript
const ar = [];
ar.push(...[1, 2, 3]);       //1. normal use-case, elegant with `...`
for (let n of [4, 5, 6]) {
  ar.push(n);                //2. mixing the inner action
  console.log(ar.length);    //   with your action     
}                            //   To do this, the loop *must* be extractable
for (let n of [7, 8, 9]) {
  if (ar.length < 8)         //3. making your own twist on the iteration
    ar.push(n);
}
//The same iteration-twists written the "apply" way
ar.push([7, 8, 9].slice(0, 8 - ar.length));

//try to imagine a world were it is impossible to extract the loop of push()... 
```

2. **Loop consistency**. When we extract the loop, we see it. We see the state it contains, the `i` (the `position` and `deleteCount` in `splice()`). We can see how it iterates, step by step. Extraction **proves** that nothing outside the loop interacts with the state of the loop. This is *why* variadic "looks good". It's not the three `...` that are beautiful per se (e.g. people don't seem to fawn over `...` in plain English texts...). The purity that an independent loop iterates over a set of elements and apply the same function to all, that is *why* we can trust it to produce fewer side-effects, race-conditions, curveballs. That is why we trust `...`. That is why "good variadic" functions feel conceptually sound.

3. **Debugability**. If you have a bug, then where is it? And why is it happening? Let's say that adding a set of nodes produce a set of callbacks. And that these callbacks in turn reads the state of the object with the variadic method. Now, if you want to debug these callbacks, you would like to step by step through the iteration that is around the inner action. If you get *a* bug in an automatic callback if you `push()` 5 elements to a weird list, then you likely want to a) extract the loop, b) step through it in devtools, c) look at the state at each point, d) follow the callbacks, until e) *before* the last step and inner action that triggers the bug. Then you understand what just happened and what you did.

4. **Syntactic consistency**. JS is a language with a long tradition of *only* using "call" syntax to invoke functions. It was only with ES6 that the possibility to "apply"-invoke functions with `...` became available, and so all old functions can always be "call"ed. Furthermore, *many* JS developers also don't use, know or do not prefer spread. We can label them "old-timers stuck in their old ways" or "newbies that must be shown the right path". But that doesn't detract from the fact that there are still many out there. The old-timers and newbies create precedent too, cause we assume others want to attract them.

   All this tradition, combined with the other three positive aspects listed above, they *all* make us assume that a JS function can *always* be used from "call". The soft syntactic rule is that *all functions can always be both called and applyed*. Including variadic functions. Thus, as a JS developer, you would expect that a variadic function can be used from "call", and thus you would expect that it has an extractable loop. Break that rule, and you make developers following this rule *guess wrong*. Making non-extractable variadic functions is breaking with tradition and inconsistent with established soft syntactic rules of JS.

## Anti-patterns

Do you feel these things are difficult? Yeah.. You are not alone! One week ago I actually googled "variadic" to see precisely what it meant, 'cause I only felt a pattern was off, and I didn't yet know exactly how (Although I should probably also mention that I have used and written variadic functions for a long time, so as to not pretend otherwise:). These things are hard. Even the experts' experts make mistakes here. So. Let's take some comfort in that and look at the mistakes/anti-patterns that are legacy and even *still being added(!)* in the browsers.

## Anti-pattern: static-looking variadic method

We start with an example that illustrate the potential confusion that can come when using `Object.assign`:

```javascript
const a = {a: 1};
const b = {b: 1};
const c = Object.assign(a, b, {c: 1});
console.log(c);   // {a: 1, b: 1, c: 1};
```

1. The `assign()` method is bound to the static `Object` class/prototype/namespace. According to what has been specified above, that would signal (be *consistent* with) a pure variadic function.

2. The list of arguments are all the same type: `Object`s. There is nothing that would make you suspect that the inner action in the variadic function should treat them differently. Furthermore, `assign()` method returns an object instance. This object doesn't look like anything the other objects when you passed them into `assign()`. That *also* looks like signature of a static, pure variadic function.

These are two general, soft, syntactic expectations that `Object.assign()` (inadvertently) echo. And that is likely to make us expect that it also *behaves* as a pure, static variadic function.

But. This is *not* how `Object.assign()` behaves. Most JS developers have run into `Object.assign()` and know the semantic rules are: the first parameter is special. All the properties of the remainder of the arguments are shallowly copied into the first parameter. And the first parameter is also what the variadic function returns:

```javascript
const a = {a: 1};
const b = {b: 1};
const c = Object.assign(a, b, {c: 1});
console.log(a);     //  {a: 1, b: 1, c: 1};  surprisingly?
console.log(b);     //  {b: 1};
console.log(c);     //  {a: 1, b: 1, c: 1};  expectedly
console.log(a === c); //  true                 surprisingly?
```

This means that `Object.assign()` behaves consistently with a variadic method, something like this:

```javascript
class Object2 {
  assign(...args) {
    for (let o of args) {
      for (let prop in o) {
        this[prop] = o[prop];
      }
    }
  }
}

const a = new Object2();
a.a = 1;
const b = {b: 1};
a.assign(b, {c: 1});
const c = a;
console.log(a);       //  {a: 1, b: 1, c: 1};  expectedly
console.log(a === c); //  true, obviously
```

## Anti-pattern #1: magic-trick-primitive

This anti-pattern is based on the `replaceChildren()` method in the JS library. We will illustrate this anti-pattern in a simplified form called `Oops`.

```javascript
class Oops {
  #list = [];

  replace(...newItems) {
    console.log("-" + this.#list.length);
    this.#list = [];
    for (let item of newItems)
      this.#list.replace(item);
    console.log("+" + newItems.length);
  }

  append(item) {
    this.#list.replace(item);
    console.log("+1");
  }

  remove() {
    if (!this.#list.length) return;
    console.log("-1");
    return this.#list.pop();
  }
}

const oops = new Oops();
for (let n of [1, 2, 3])
  oops.replace(n);           //-0+1-1+1-1+1   //list is 3
oops.replace(...[1, 2, 3]);  //-1+3           //list is 1,2,3
oops.replace(...[1, 2, 3]);  //-3+3           //list is 1,2,3
while (oops.remove())        //-1-1-1
  ;
for (let n of [1, 2, 3])
  oops.append(n);            //+1+1+1         //list is 1,2,3
```

**Conceptually**, `remove()` and `append()` are primitives, and `replace()` is a composition. There is nothing stopping you the human programmer from imagining that you can replace `replace()` by first `remove()` everything, and then `append()`ing. 1+1=2.

But. `Oops.replace()` is a variadic function that does *two* things. First, `Oops.replace(...args)` removes the old items from the list, and then it appends the new `args` one by one. It does two state mutations: first the old `this.#list` is cleaned and then the new `args` added. And only one action *can be* controlled by the loop. This means you can't extract the loop, because you will not manage to avoid doing the *before* action more than once. And because the variadic loop cannot be extracted, the variadic function becomes a primitive.

But. What about `append()` and `remove()`? Can't they replace `replace()`? Potentially, they could. But `replace()` needed to handle side-effects differently (here exemplified as `console.log()`s). That means that when you deconstruct `replace()` with `append()` and `remove()` which is what any normal human being would think they could do, the consequences surprise you.

So, what kind of primitive is this? It's like a magician that takes a full glass of water behind the curtain, empties the water on the floor, fills the glass with M&Ms, says abracadabra, and then shows the birthday kids the glass with M&Ms to applause and anticipation of candy. The adults in the rooms first thoughts are: "that's primitive!! Who is going to clean up all that water?! And the wet glass is going to partially dissolve the M&Ms' glazing so the white, unwashable carpet the kids are sitting on will definitively be M&M colored... ahh, crab!".

## Anti-pattern #1: caveman primitive

The second anti-pattern is based on the new `HTMLSlotElement.assign()`. It is very similar to the magic-trick primitive, except that now you don't have `append()` and `remove()` get-out-of-jail-dirty-card. Here, there is **no way** to simulate variadic loop extraction. None. How does that work?

```javascript
class Oops {
  #list = [];

  assign(...newItems) {
    this.#list = [];
    for (let item of newItems)
      this.#list.push(item);
  }
}

const oops = new Oops();
oops.assign(...[1, 2, 3]);  //#list = [1,2,3]
oops.assign(...[1, 2, 3]);  //#list = [1,2,3]
for (let n of [1, 2, 3])
  oops.assign(n);         //#list = [3]
```

`Oops.assign()` mirrors `Auch.replace()`. Except here, there is no other. This time the magician also has a club and says in his caveman voice: "i am the only source of M&Ms and I am the only one who gets to empty water. A caveman primitive: "use me or sleep outside with the lions!"

The consequence of this pattern is that your use-cases freeze up. You can only add *all* the M&Ms at the same time. No chance filling half the glass with M&Ms and then telling the kids that they will get one M&M for each popcorn they pick out of the carpet until the glass is full. No chance telling the kids that if they pull the cats tail one more time, you will take 10 M&Ms out of the glass and eat'em. You can't say: "no M&Ms kids, until you have all drunk that glass of water". You are no longer in control of your use-cases.

Loop extraction open up for debugging. It opens up for the 100 use-cases you didn't think about when you first made the function. It opens up for freedom of choice. While at the same time preserving **conceptual consistency** and *almost identical* behavior using `...` the "apply" way. If a strong, robust caveman primitive is what you need, and there might be times for that too, then "sure, ok, but don't pretend that it is honoring the variadic contract."

## How to spot a caveman and magic-trick primitive?

Ok. So how to avoid such patterns? After all, it really is so difficult to spot that even experts' experts don't see it. Well, here are some clues: 

1. It will be a variadic *method*. It *caaan* diguise itself as a static/pure function, ie. surprise you by causing unexpected state changes to global or some or all of its arguments, but that bug should have been spotted earlier.

2. The variadic method will do *more* than *one* thing inside this method. The variadic method will do at least *one additional* action either *before* or *after* the loop.

3. The *outside the loop* action(s) mutates state. (if it didn't, it would be considered part of the loop and the loop's state. Now, I would expect that a variadic method with a non-extractable loop *also* did state mutations in the action inside its main loop, but that is not necessary. As said earlier, it could be a method masquerading as a function.

4. The *outside the loop actions* are likely some kind of clean up or additional loops that make the method more efficient: "we need to do a) first, before we loop the args and do b)"; "we don't really need to do this operation at every step, it will be much more efficient if we do everything at the end". Something like this.


## Anti-pattern

array.flat should be static. It should communicate that it is pure. And it would require creating an array before invocation (adding a step with `[]` in the outside code).

append runs recursively.

## variadic setting arguments

`array.splice()` is another even weirder variadic method. It uses *both* *two* "variadic settings" and its passes a loop state to its inner action. The variadic settings are `position` and `deleteCount`, and together they control the behavior of the loop state passed to the inner action.

Before we look at how this works conceptually, be warned: it's *hairy*. It's not pretty. Remember, no one likes `.splice()` to begin with. My personal response would have been: "No! This should be *two* methods: first delete at position, then a variadic splice at position. Why choose to merge these two actions into one? So that you in some edge cases can call them in one line and get some minor performance benefit? At the expense of a complex conceptual logic if you use the `deleteCount` second argument? Nope. Wrong. Too complex. Unnecessary." Is my opinion.

```javascript
function deleteAction(position, deletes) {
  if (deletes === 0)
    return;
  for (let i = position + deletes; i < this.length; i++)
    this[i - deletes] = this[i];
  const last = this.length - 1;
  for (let i = last; i < last - deletes; i--)
    delete this[i];
}

function insertAction(position, arg) {
  for (let i = this.length - 1; i >= position; i++)
    this[i + 1] = this[i];
  this[position] = arg;
}

Array.prototype.unshift = function splice(pos, deleteCount, ...args) {
  for (let i = 0; i < args.length; i++) {        //the loop
    deleteCount = i === 0 ? deleteCount : 0;     //loop parameter: isItFirstStep
    deleteAction(pos + i, deleteCount);          //inner action
    insertAction(pos + i, args[i]);              //inner action
  }
};

const ar = [1, 2, 3];     //ar => [1,2,3]
ar.unshift(...[4, 5, 6]); //ar => [4,5,6,1,2,3]
```

## This is an alternative

```javascript
//todo debug and make sure it works. This is top of my head.
function innerAction(position, deletes, arg) {
  if (deletes === 0) {
    for (let i = this.length - 1; i >= position; i++)
      this[i + 1] = this[i];
  } else if (deletes > 1) {
    for (let i = position + deletes; i < this.length; i++)
      this[i - deletes + 1] = this[i];
    for (let i = 1; i < deletes; i++)
      delete this[this.length - 1 - i];
  }
  this[position] = arg;
}

Array.prototype.unshift = function splice(pos, deleteCount, ...args) {
  for (let i = 0; i < args.length; i++) {        //the loop
    deleteCount = i === 0 ? deleteCount : 0;     //loop parameter: isItFirstStep
    innerAction(pos + i, deleteCount, args[i]);
  }
};

const ar = [1, 2, 3];  //ar => [1,2,3]
ar.unshift(...[4, 5, 6]); //ar => [4,5,6,1,2,3]
```

## Anti-patterns: "static-method" and  "method-static"

Pure functions should be static. You shouldn't bind them to an object as a method, because that will make others seeing it from the outside think it somehow interacts with the state of that object. When it doesn't. 'Cause it's pure.

Hence, the static variadic function should be **static**, ie. accessed by name and not associated with any instance objects. The static variadic function also returns an output And so when a variadic function

Before we move on to the other patterns for variadic functions, we should here stop and look at how we can implement different variadic loops and control these loops using variadic setting parameters.

## Different variadic loops

There are essentially no bounds to the ways in which the variadic function should iterate the arguments given. The variadic function can process the argument sequence front to back, back to front, in twos, in twos overlapping each other, every third, recursively stepping into nested sequences among the arguments, randomly choose elements one by one, etc. The variadic loop *must not* process all arguments; and the operation performed might be different for the first step than the second. The loop can be weird, complex, highly specific, etc.

## Extrapolation of the variadic loop, and decomposability

But. The variadic loop isn't completely lawless. First. The loop should be pure. That means that the state of the loop should not be affected by the operations performed at each step. The loop can in a sense pass parameters to the inner action (the inner action can be different for the first than the second step), but the output of the inner action should not affect the state of the iteration.

If the

1. The loop should be pure. It's state should not be dependent on the operation. This means that you should be able to remove the inner operation  'there should be *no* state changing operation *before* or *after* the loop. This is necessary to make the variadic function decomposable, as we will return to shortly. Creatitivy The important thing is that the variadic function doesn't

The is a native, simple static variadic function. It uses an example of a simple static variadic function:

```javascript

```

##   

## Anti-pattern: False-static

or should this come after pattern 2?

## Pattern 2: instance variadic functions

It would make no sense to have a variadic function that operated on its arguments as if they were fixed-length:

if the variadic function inside did not at some point loop over all these items and made one or more operation per iteration step.

A *good* variadic function contain *only* these two things. But variadic We will return to the other situations where

There are three *key* principles that you need to be aware of here:

1. "You can *always* apply": You can *always* use "apply" syntax and lists with `...` to invoke a function in JS. Even when the JS function internally a) declare a fixed-length list of arguments, and b) do not use the global `arguments`, it is still no problem to take a list and then invoke a function the "apply" way:

```javascript
const thisLooksStupid = ['click', e => console.log("don't try this at home"), true];
window.addEventListener(...thisLooksStupid);
//and click
```

2. "You must extrapolate iteration to call variadic functions. You can *always* call "

several *key* points here. And they are complex. It is important to mention

1. In principle, the JS interpreter *creates/clones* the list of arguments for every invocation. You can *never* pass an array *directly* into a function. That means that if you mutate the list of arguments inside the function, even though you use ES6 syntax and spread on the outside, there will never be a mutation on the list passed into the function.

> Detail. When the JS run-time invokes a variadic function created using the spread operator, it will create a new list for the variadic arguments. This means that even when you mutate the variadic arguments on the inside of the function, those mutations are not reflected out into the calling context.

2.

As we can see, there are several

an indefinite list of arguments to consider a function variadic

It will go through a series of native functions in JS and describe their behavior.

A variadic function is a function that accepts a list of arguments where a) all the arguments are treated as the same type and b) the number of arguments are indeterminate. In simple terms, a function or method where you can have as many arguments as you like, but where each argument must be same type(ish).

The `Math.min(num, ...)` is an example of a variadic function in JS. The `Math.min(..)` takes a series of numbers and then returns the smallest number. The "variadic trick" is that `Math.min(..)` doesn't limit how *many* numbers you can pass into it at the same time. It can therefore be used like this:

```javascript
Math.min(1, 2); // 1
Math.min(1, 2, 3, 4, 5, 6, -78, 9, 0); //-78
Math.min(100002, 100001, /*and an infinite list goes on*/ -1, -2, -3); // -3
Math.min(...longListOfNumbers);
```

## Different types of variadic functions in JS

There are at least four different types of variadic functions in JS:

1. pure (decomposable)
2. internal mutation (decomposable)
3. additive (decomposable)
4. non-decomposable

We start by looking at the pure variadic function and discuss that in detail. Then we will return to the three other types of impure variadic functions that produce side-effects.

#### Pure variadic functions in JS

Examples of pure variadic functions in JS are: `Math.min`, `Math.max`, `String.fromCodePoint`. The principle of a pure function is that it takes a series of arguments and produce a new output without making any changes neither to the input nor the output.

Pure variadic functions are "decomposable". Decomposable here means that you can break down any "variadic call" to the function that rely on the function having an indeterminate argument list length into a series of calls as if the function was "normal" function with fixed-length-parameters.

```javascript
Math.min(1, 2, 3, 4);
// can be decomposed into
let min = 1;
min = Math.min(min, 2);
min = Math.min(min, 3);
min = Math.min(min, 4);

// and
const ten = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
Math.min(...ten);
// can be decomposed into
let min = ten[0];
for (let i = 1; ten[i]; i++)
  min = Math.min(min, ten[i]);
```

#### How do a variadic function look inside?

Variadic functions can be used when your function a) only require one sequence as input, and b) that sequence holds same type(ish) arguments. By "same type(ish)" we mean that the variadic function treats the arguments as the same type, such as strings, but it might still be passed other types too such as numbers. The variadic function will take the sequence of arguments, iterate over them, and perform one action based at each point in the iteration.

```javascript
//spread variadic
function plusOne(...numbers) {
  return numbers.map(n => n + 1);
}

//old-school variadic
function plusOne(/*we use global arguments instead*/) {
  return arguments.map(n => n + 1);
}
```

A variadic function can always be implemented as a "normal" fixed-length function that accepts a single parameter holding a sequence. For example:

```javascript
//spread variadic
function plusOne(...numbers) {
  return numbers.map(n => n + 1);
}

//normal equivalent
function plusOne(numbers) {
  return numbers.map(n => n + 1);
}
```

But. This conversion from one to the other is not a mirror. Many "normal" functions require a fixed-length parameter set and use the parameter position meaningfully: for example `addEventListener(type, fun, options)`, `Map.set(key, value)`, `Element.remove()` and `setTimeout(fun, ms)`. These "normal" functions should not be implemented as variadic functions. (It is of course *technically possible*, but you don't want to do that). Thus, variadic functions can be considered a subset of "normal" functions: functions that accept a single sequence parameter.

Having said that, this doesn't mean that "variadic" is a freak concept, on the contrary. *Many* functions benefit from having a "variadic" design internally. Variadic is actually *good*. If your function *internally* can work like a (decomposable) variadic function, then you *should* do it! And, this is a universal, golden rule, akin to "if all else is equal, make your function pure". And we LOVE universal, golden rules:)

### Impure 1: internal mutation variadic function

`Object.assign` and `Object.freeze` are examples of *impure* internal mutation variadic functions. An impure function will make changes to the internal content of arguments sent to it, or some external state. Internal mutation variadic functions mutate the arguments passed in. This means that internal mutation variadic functions *must* be passed mutable arguments, ie. `Object`s.

There is precedent for *two* different types of argument mutation. The internal mutation variadic functions can (try to) mutate:

1. the *first*(`Object.assign()`) or
2. *all*(`Object.freeze()`) argument objects.

As an *impure* variadic function, all internal mutation variadic function *should* return `void`. The reason for this "if impure, return nothing"-rule is that breaking this rule is likely to make the developer *think* that the function is pure. We can look at `Object.assign()` to understand how and why.

```javascript
const a = {a: 1};
const b = {b: 1};
const c = Object.assign(a, b, {c: 1});
console.log(a, b, c);
```

The problem is that `Object.assign()` returns the first argument, `a` and `c` is the same object. The method prints: `{a: 1, b: 1, c: 1} {b: 1} {a: 1, b: 1, c: 1}`.

This can cause confusion. Without manual in hand, the developer is likely to look at `c` and see a simple product of its input. And, match that with the golden rule that "if all else is equal, make your function pure". `Object.assign()` definitively looks like it could be pure. And so, expectations are that it should *not* mutate the first argument. And when it does, not only has `a` already been mutated, but future uses of `c` might do even more mutations. Yes, experienced developers all know this. Because they have all learned the hard way.

There are of course reasons why `Object.assign` mutates its first argument. It does so because mutation here is the desired outcome. `Object.assign` should update `a`, not *create* a new `c`. And, if you want `Object.assign` to create a new object `c`, and not mutate `a`, then you can by simply pass in an empty object literal as its first argument: `Object.assign({}, a, b, {c: 1});`. That is *convenient*, *smart* and *efficient*, **iff you *know* the manual**, and **iff you are careful not to overlook the mutation to your first argument**.

And that is a bad combo. Yes, we value both *convenient*, *smart* and *efficient*. But we also value a) self-explanatory, b) "if it can be pure, make it pure", and c) *most importantly* "if it is likely to cause confusion that leads to bugs that are hard to discover, that is really, *really* bad". And, due to the return value convenience, `Object.assign()` checks all these boxes. That makes `Object.assign()` clever, not smart (clever means "bad" in developer speak).

The conclusion is: To internally structure functions that do internal mutations on its arguments is not bad; it is no worse than doing internal mutations in normal functions. But. Return `void`.

## additive variadic functions

Many builtin variadic functions in the browser both a) return `void` and b) do not (primarily) mutate the input arguments. Then what? What do these variadic functions do? They primarily add the sequence of variadic items into another sequence.

One example here is `Array.push()`. You can use this method both to do a regular `call`/`apply` with a single element, an `apply` with two or a list of elements, or you can *compose* the same `apply` behavior by iterating over the items to be added in the context of use.

```javascript
function contextOfUse() {
  const one = 1, two = 2, theRest = [3, 4, 5];
  const applyArray = [];
  applyArray.push(one, two, ...theRest);
  const callArray = [];
  callArray.push(one);
  callArray.push(two);
  for (let item of theRest)
    callArray.push(item);
  console.log(applyArray, callArray); //2x [1,2,3,4,5]
}
```

Some variadic functions also do work with the iteration sequence itself. That is good, it can help the developers using the variadic function simplify his own code. The example below of illustrate the slightly more complicated decomposition of `Element.prepend(...)`.

```javascript
function contextOfUse() {
  const nodes = document.querySelectorAll('h1'); // we assume there are some h1 in the DOM.
  const div1 = document.getElementById("one");
  const div2 = document.getElementById("two");
  div1.prepend(...nodes);
  for (let i = nodes.length - 1; i >= 0; i--)
    div2.prepend(nodes[i]);
}
```

Now, impure additive variadic functions are fine. They are impure/"programming in place", but other than that and as long as they both return `void` and remain *decomposable*, they provide a nice, flexible API.

## non-decomposable variadic functions

However, there are situations where variadic functions are *not good*. This situation arise when the variadic function *breaks* with the principle of *decomposability*. But to understand why it is *bad* to break this principle, we must simultaneously something about why *decomposability* is good:

## How variadic functions become non-decomposable?

The lack of decomposability is a symptom: *inside* the variadic function *something* idiosynchratic happens that for some reason *cannot* be replicated if the variadic function is called sequentially from the outside. This signals that "sound conceptual logic" *might* be at stake, with race conditions, unforeseen side-effects, and state discrepancies around the corner.

The most likely culprit is that the variadic function is doing an action (side-effect) *outside* iteration, ie. *before* it starts the iteration or *after* iteration has completed, but before it returns. Here are two examples:

1. The `HTMLSlotElement.assign(...nodes)` is a non-decomposable variadic function that roughly work as follows:
	1. removes all the previously assigned nodes on the `<slot>` element, and then
	2. iterates over the variadic nodes where it
		1. removes any `<slot>` that the node was assigned to, and
		2. assigns each node to the slot.

   Action 1 takes place *outside* of the iteration. But. When we try to decompose this variadic function and call `for(let n of nodes) slot.assign(n)`, then action 1 moves into the iteration:
	1. iterates over the nodes where it
		1. removes all the previously assigned nodes on the `<slot>` element, and then
		2. removes any `<slot>` that the node was assigned to, and
		3. assigns each node to the slot.

2. In a loose sense, the `replaceChildren()` can be decomposed into a sequence of `remove()` and then `append()` normal `call`s. But. `replaceChildren()` is non-decomposable in a *strict* sense: when replaced with `append()` and `remove()`, then
	1. the set of mutation records will be different and
	2. sequence of different at each `(dis)connectedCallback()` might differ, and
	3. the state of the DOM is likely to be different (or so I have heard).

   To illustrate, I will speculate as to how this happens ((todo replace with a small test)):
	1. The `replaceChildren()` seeks to make the creation and registry of MutationRecords easier to work with and more efficient. It therefore bypasses the `remove()` and `append()` methods that create mutation records directly *inside* iteration, and instead creates the records *bulk* at the end, *outside* iteration.
	2. Internally, the `replaceChildren()` also collate elements that are removed and appended call their `disconnectedCallback()` and `connectedCallback()` *bulk, after* iteration, and not one by one inside iteration as its decomposed version would do. This means that for example the DOM looks differently at each callback.

## Why is this bad?

Conceptually, a variadic function can by its very nature be understood as both a set of many actions and one atomic/primitive action *at the same time*. On one level, the variadic function is one big action that is `apply`-invoked on one big list. And, on another level, the variadic function is a small function that is applied many times on each element. *Both* is true at the same time. The variadic advertise this double guarantee through its syntactic design. Through the little dots in `variadic(...list)` we see a glimpse of the contours of the pure loop, we see nice bright colors of the double guarantee shine through. The syntax itself isn't pretty; it is the guarantees and the consequences of those guarantees that the syntax alludes to that make it cool and pretty. (For those of us fortunate enough to have the experience to understand and recognize them that is;)

> The variadic function says: "I am really just a pure loop over a small atomic operation. If you understand what my atomic operation on one or a pair of elements, then you understand what I will do on a big list of elements. That makes me easy to test. I am safe. And my footprint is small and pretty. Trust me".

The non-decomposable variadic function, however, does a "clever" little trick. On the one hand it still hints at being a sequence of identical smaller actions, of *decomposability*. But, with the other hand, it simulteneously *declares* that it is *only* a primitive, atomic action that *cannot* be replicated by calling the variadic function sequentially. It's false advertising.

And here is the rub. It is not technically necessary. All else *is* equal if the non-decomposable variadic function instead was declared as a "normal" single-parameter-is-sequence function. That explicitly *signal* non-decomposability. It is like putting a Mercedes star on a Lada. Why? Just own the Lada man, it's cool too!


[comment]: <> (#### What interface to put on my single-sequence function?)

[comment]: <> (But. Even though we *always* want to *internally* structure our function as if it was a variadic function, that doesn't mean that we want the *external* interface of our function to be variadic too. So, when do we want to *present* our function to our user programmers as variadic and when do we want the normal single-sequence function interface?)

[comment]: <> (The answer is half'n'half.)

[comment]: <> (You want the variadic interface for your function when you expect your function to be used *mostly* with:)

[comment]: <> (* arguments that are retrieved **individually** from different sources)

[comment]: <> (* &#40;which often correlate with just a couple/handful arguments&#41;.)

[comment]: <> (```javascript)

[comment]: <> (function variadic&#40;...numbers&#41;{)

[comment]: <> (  return numbers.map&#40;n => n+1&#41;;)

[comment]: <> (})

[comment]: <> (function normal&#40;...numbers&#41;{)

[comment]: <> (   return numbers.map&#40;n => n+1&#41;;)

[comment]: <> (})

[comment]: <> (function contextOfUseThatHoldsManyVariables&#40;&#41;{)

[comment]: <> (  const first = 0;)

[comment]: <> (  const secondAndThird = [1,2];)

[comment]: <> (  const weLikeThis = variadic&#40;first, ...secondAndThird&#41;;)

[comment]: <> (  const thisNotSoMuch = normal&#40;[first, ...secondAndThird]&#41;;)

[comment]: <> (})

[comment]: <> (```)

[comment]: <> (You want a normal, single-parameter-is-sequence interface for your function when you expect your function to be used *mostly* with:)

[comment]: <> (* **one** list of arguments)

[comment]: <> (* &#40;which often correlate with many arguments&#41;.)

[comment]: <> (```javascript)

[comment]: <> (function variadic&#40;...numbers&#41;{)

[comment]: <> (  return numbers.map&#40;n => n+1&#41;;)

[comment]: <> (})

[comment]: <> (function normal&#40;...numbers&#41;{)

[comment]: <> (   return numbers.map&#40;n => n+1&#41;;)

[comment]: <> (})

[comment]: <> (function contextOfUseWithASingleListVariable&#40;&#41;{)

[comment]: <> (  const allMyNumbers = [0, 1, 2];)

[comment]: <> (  const nowThisIsBetter = normal&#40;allMyNumbers&#41;;)

[comment]: <> (   const andNowThisNotSoMuch = variadic&#40;...allMyNumbers&#41;;)

[comment]: <> (})

[comment]: <> (```)

[comment]: <> (The difficult part here is that you *do not know in advance* exactly how your users will use your function. You have to guess. And speculate/analysize your function's "likely future use-cases". And that is as much art as science. Because your function will most likely be used in both situations, and so you will have to make a&#41; a guess as to which situation occurs most often in its future context of use and b&#41; an assumption about which situations the developer needs most guidance from the structure of your functions API.)

[comment]: <> (In addition to the actual use-cases, you also have to take into consideration your users syntactic preference. How do other similar functions in my library behave? How will my users "first try to use" my function? If I chose one alternative, will they be able to use it without "reading the manual"? Maybe 60% of my expert users *know* both variadic and normal invocation well and prefer variadic design, while 20% of my novice users *do not know* how to `apply` a variadic function to a single sequence variable, and therefore might exclude themselves from using your function &#40;in 20% of the usecases&#41;? Maybe you need 100% of your users because that is good for business? Or maybe it is good karma to nudge your novice developers in a different direction, just for now?)

[comment]: <> (And. The problems don't end here. This decision is also complicated by what *type* of variadic function you are making. But more on this shortly. First, we need to look deeper into `call` vs. `apply`.)

#### `call` vs. `apply`: history

When you invoke a function with a fixed set of arguments, we can say that you `call` that function. But, if you invoke a function on a list of arguments that are to be "spread out" as individual arguments, then we can say that you `apply` a function to a list.

`call`ing a function with a fixed length argument list is considered the "normal" way to invoke functions. This is how function invocation is taught to beginners, and some programming environments do not support any other means to invoke functions (for example, JS did not support any way to `apply` functions in the beginning (todo find reference/fact check!!)).

In the early 00s, the reflective method `Function.apply` was introduced in browsers giving JS developers the technical ability to invoke variadic functions on a list. But, reflection is a verbose and complex way to invoke a method: `Math.min.apply(null, [1,2,3,4])`. And therefore, JS developers by and large *still only* `call`ed function with leaving the use of `apply` invocations in the domain of the experts.

But then. With ES2015 came the spread operator. And some years after that, say 2018-2019?, browser adoption was so high that "everybody" could use it. And the spread operator enables developers to invoke functions the `apply` way with ease:

```javascript
const listOfNumbers = [1, 2, 3, 4];
//before say 2019
Math.min.apply(null, listOfNumbers);    //1
//became after 2019
Math.min(...listOfNumbers);             //1
```

As the spread operator was introduced, so where a lot of new library methods that allowed for `apply` style invocation. For example, the newer variadic `append()` came to complement (in the long term replace?) the older `appendChild()` that can only be `call`ed.

This new linguistic, cultural, technical wave enabled developers to invoke library methods using *both* the `apply` and `call` approach. The JS developers that upto 2015~2021 had *always* `call`ed functions, could now gradually transition to elegant `apply` invocations. Voluntarily.

The reason why this transition *had to be* voluntary was that almost all the users of JS *only knew* how to `call`. It would have been unfeasable to demand that they *all switched*. But. Another, and more important reason, is that *when a variadic function is composable, the user can *choose* to `call` or `apply` at his own discretion*. All variadic functions that are *composable* afford the developer this choice. And most variadic functions are (and all should be) composable. The principle of "freedom to choose", "unopinionated platform", "low bar for beginners", "style and efficiency for experts", *and* "sound conceptual logic" *all* came together in *one* fortunate when variadic functions met one important criteria: *decomposability*.

We now move into more complex variadic function design.

It is like presenting a function as if it is pure, but then doing lots of state mutations on global variables. Sure, at first sight, it looks pretty, but it doesn't take long before the "cleverness" starts to smell a little.

A variadic interface is *not only* a cool way to pass a list into a function, it says something more. When a function should signal to its developer users that this conceptual duality is *not* present, it should do so by using... a "normal", `call`, single-parameter-is-sequence interface.

The `HTMLSlotElement.assign()` is the only fully non-decomposable variadic functions in the platform that I know of. Here is how it works:

```javascript
``

```

that that is a good example of a sequence function that alludes to pretending to be something that it is not.

and `Node.replaceChildren()`

3. It is inconsistent with JS convention that library variadic functions are commonly decomposable.
4. When a non-decomposable variadic function is to be applied to a list, then it can *only* be invoked with the `apply` mechanisms: ie. in some use-cases, the developer *must* use the spread operator or the Reflection `apply` method to use the method. If there are no alternative library function that enable developers to make a `call` to achieve the same outcome, this is both *historically inconsistent* in JS and *opinionated* because all else *is* equal if a `call` interface had been given the method.

The principle of "freedom to choose", "unopinionated platform", "low bar for beginners", "style and efficiency for experts", *and* "sound conceptual logic" *all* came together in *one* fortunate when variadic functions met one important criteria: *decomposability*.

If you have a The variadic `prepend()` is better than the normal `prependChild()`. And , they do not *break with tradition* and lets the user of the function choose if he/she wants to invoke it using `call` logic or `apply` logic. For expert eyes (experts here simply meaning developers comfortable working with both forms of invocation), the choice to always use `apply` over `call` seems obvious. However, for developers that for some reason or another prefer one particular invocation strategy, the library remains *unopinionated* and *consistent with JS tradition* of letting developers choose invocation strategy.

However, this method will append a sequence of nodes into another. one element into another, using the `push method, at one point of another. And the `pushAll()`

Ok. Describing use-cases for the imperative slotting API part 2.

In 99% of the use-cases where you in `"automatic"` slotting mode would use the *default* `<slot>`, you would in `"manual"` mode use some version of:

```javascript
slot.assign(...[...this.childNodes].filter(some => thing));
//or
slot.assign(...this.querySelectorAll(":scope > li"));
```

This is the listOf-`<li>`-slot use case. Here, you will have *one* variable/source (`this.childNodes` or `this.querySelectorAll`), and that *one* variable will be a list.

In the use-cases where you in `"automatic"` mode would use `<slot name="something">`, you most likely will have *one* variable/source pointing to *one* node:

```javascript
slot.assign(this.children[0]);
//or
slot.assign(this.querySelector(":scope > lh"));
```

This is the `<lh>`-slot use case. I am having difficulty imagining good scenarios where you would have *two* variables/sources, ie. `assign(one, two)`. And I can't think of any native element that has such a conceptual structure. But, there is nothing wrong making room for `one, two`. But tailoring the API for it, that I don't think wise.

Now, ask yourself, if somebody put a gun to your head and said: "you have to choose between default `<slot>` and `<slot name>` and you can only have one!" Which one would you choose? It's not even close. The default `<slot>` is your favorite child! `<slot name>` is a) ugly and b) useless and c) when you look at her, she somehow seems to make you think about that eager colleague of your wife. Anyone spending 5 minutes in a room with both kids will feel the same way.

The problem is that the earlier comment you are referring to holds the use-cases in reverse priority. "most cases" refers to the imperative equivalent of `<slot name>` and `<lh>`-slot; "the exceptional case" is the imperative equivalent of default `<slot>` and listOf-`<li>`-slot. `<slot name>` is named the favorite. Use-case-wise, and metaphorically speaking, it's the man with the gun saying "we are going to shoot our favorite child." ;)

But. I don't know. I am not sure that the real issue here is the use cases. First, I am an optimist. I interpret the silence from the other participants on the topic of use case prevalence as "silently not-disagreeing anymore". But, second, I think the main problem lies elsewhere, namely in the structure of `HTMLSlotElement.assign()` and the specific variadic pattern that it implements and now also builds precedent for.

What I am re-litigating here, is *not* the use of spread. I *heart* spread... I am re-litigating `HTMLSlotElement.assign()` because it makes a *brand new policy shift* from a) encouraging/asking to b) requiring/demanding that the developer use spread. Why relitigate? What is at stake? Can we save `HTMLSlotElement.assign()` after it has been shipped? Maybe. Should we? Maybe. But, what we definitively can save is precedent.

The real question here is what does `assign()` *actually* do? How come `assign()` *demands* the use of spread when 99% of the other variadic functions such as `append()`, `[].push()`, `Object.assign()`, `Math.min()` don't? Sure, a decision and code was made that turned out this way, but the code must be *doing* something to enact this difference. What? How does `assign()` actually manage to throw "voluntariness" out the window? After all, none of the other variadic functions even touched it. What is `HTMLSlotElement.assign()` doing differently than all the other variadic functions in the browser to manage to *create* this brand new external requirement?

I state that `HTMLSlotElement.assign()` is using a bad variadic pattern. Inside the variadic function it makes state changes outside the loop. Because of this behavior, `assign()` *must call the variadic function only once* for the whole list, and therefore the developer *must* use the spread operator/`apply` when invoking it on a sequence. That is a variadic anti-pattern.

A correct implementation of the variadic pattern would do *no* state changes outside the inner iteration. `append()`. `Math.min()`... A correct implementation of the variadic pattern would therefore produce the exact same result if the iteration is done outside or inside the variadic function. Therefore, the variadic function can be both `call`ed and `apply`ed. Therefore, the developer can choose. And the thing that makes the variadic function pretty is the conceptual elegance and soundness that follow from this duality. A variadic function is *not* just about how you pass arguments into the function, the variadic pattern *is* to obtain consistency through pure iteration which then affords freedom of choice.

Functions that behave like `HTMLSlotElement.assign()` and `replaceChildren()`, ie. do some statechanges first, iterate over a single sequence, do some work after, and then return, they are normal fixed-length-parameter function with a single parameter with a sequence. By giving them a variadic signature they are just presented as more elegant than they really are. It is false advertising.

So, even if we make the awful assumptions that we don't care about developer's freedom of choice and the misguided one that `<slot name>` is the golden child and say that the similar behavior in `replaceChildren()` gives `assign()` precedent, *even then* `assign` is still wrong. It is an anti-pattern, we should fix both `assign()` and `replaceChildren()`, and we should *not* do it again.

To make sure everybody is on the same page, the counter argument was first that "the use of spread in DOM methods is not brand new". Lots of other variadic functions in the DOM *encourage* the developer to use `...` spread. `append()` et.al. Full agreement.

Here the response differed:

1. the distinction between when the browser *asks* for something and when the browser *demands* something from JS developers is a criteria _I_ set up. The browsers don't care about such "voluntariness". They care about other stuff such as "consistency". To that I can only say that I sincerely appreciate the honesty and directness of the comment.
2. There is *one* precedent for *demanding*, not only *encouraging* spread. `replaceChildren()` cannot be replaced by a series of `remove()` and then `append()` calls. Because the state of the DOM is different in the callbacks and the MutationRecords look different. The DOM geek that I am of course love such a geek case:) But if anything should qualify for the title "the exceptional case", then it's this situation. I don't disagree that the DOM and the implementation define `replaceChildren()` as a primitive, and that because of its primitive nature situations occur where it is unsafe to replace `replaceChildren()` with `remove()!+append()`. To disagree with that would be stupid of me. You built it. You say it is like that. I believe you. But. I disagree that it *should be* considered a conceptual primitive: ~`removeAppend()`~ should conceptually be the same as `remove(),append()`. And I disagree that this feature creates valid precedent: two bugs doesn't make a right and shouldn't
   establish precedent.

But. The real question here is what does `assign()` *actually* do? How come `assign()` *demands* the use of spread when 99% of the other variadic functions such as `append()`, `[].push()`, `Object.assign()`, `Math.min()` don't? Sure, a decision and code was made that turned out this way, but the code must be *doing* something to cause this difference. What? How does `assign()` actually manage to throw "voluntariness" out the window? After all, none of the other variadic functions even managed to lift it off the ground. What is `HTMLSlotElement.assign()` doing differently than all the other variadic functions in the browser to manage to *create* this brand new external requirement?

Why relitigate? What is at stake? Can we save `HTMLSlotElement.assign()` after it has been shipped? Maybe. Should we? Maybe. But, what we definitively can save is precedent. I state that something is wrong inside `HTMLSlotElement.assign()` that make it *require* the spread operator on the outside. `assign` implements/uses the variadic pattern incorrectly. Even if we make the awful assumptions that we don't care about developer's freedom of choice and the slightly misguided one that `<slot name>` is the golden child, *even then* `assign` is still off. The closest thing we can find to give it precedent is the bad sides of `replaceChildren()`. It doesn't behave like the other *nice* variadic functions in the browser. This one is different. Not good. Let's try to find out what is going on with this one so we don't repeat the pattern.

others

But, most of these other variadic DOM methods such as `append()` don't *require* spread. Here you can iterate outside it if you want. Why is that? What *is* the difference between `append()` and `assign()` actually? Why can you *always* choose with `append()`, and what is it about `assign()` that sometimes (read: in most use cases) *impossible* to use it without spread?

My immediate reaction was that I thought that 10.000 JS developers would have a bad evening this december due to this requirement. But, after having discussed the topic here, I have come to view it as as much an intriguing )

doesn't just allow for use with spread, it cannot be used without spread in the default `<slot>` use cases. Here, the response from the whatwg representatives are disturbing: first, they don't openly recognize this change. I love the counter argument with `replaceChildren()` and MutationRecords, super nerdy technical tidbits snacks, but it isn't strong enough. Even if one accepts that it cannot be replaced with `remove()` and `append()`

But, at issue here is a new pattern. `HTMLSlotElement.assign()` is the first function in the browser that demand the use of the spread operator.

at stake here is a pattern being employed here by

on the topic of use case as silent agreement (or at least ) on the use case hierarchy I described above I think that my previous comments on use cases , and the silence on the subject I interpret as that they are convinced

Use-case this, use-case that.. I dunno. It sometimes can seem that it is just code word for "we have decided". Now I have no idea, but I took the ensuing silence from the other participants on the topic of use-case preference after my comment on native element parallels to mean that

I am not really sure if you would and and b)  as the `"manual"` equivalent of the default `<slot>` in `"automatic"` mode.

Shipping status:

1. the feature is shipped in Chrome, FF, and whatwg.
2. The feature is not shipped in Safari(?)
3. There are still *not really* any examples nor description of how to use on neither google nor stackoverflow(?)
4. MDN has for the last 6 months (and still do) describe `assign` as if it were non-variadic.

This means that as of now we can assume that a) only super expert users have started experimenting with it? I am not saying that it is not a super mayor issue to reverse shipping course here, I am sure it is, but we should still consider it "early shipping" and that if it is a bug, that changes are in the realm of doable/maybe, not impossible/out of the question?

I see that my previous comment might have been a bit difficult to follow if you are not *totally inside* the concept of variadic and `HTMLSlotElement`. I will therefore try to exemplify a good vs. and a bad&ugly variadic pattern in plain JS.

A good variadic pattern. Follows the model of `append()`.

But. I still believe that my point is not being fully understood.

I am fine with things being primitive. But, yes, I do believe that the *syntactic* sugar of variadic function signature *should* be preserved for genuine variadic functions with pure iteration that can be extrapolated. But, I am also saying *yes*, *all the variadic functions in the browsers today meet this requirement, *except* `HTMLSlotElement.assign()` and `replaceChildren()`.

And. I am unsure if I manage to communicate how deep this *syntactic* lapse runs. Let me address the issue not from the perspective of the human programmer, but from the programming language side. When the JS runtime invokes a function, it does so in *one* way: it passes a sequence of arguments to a function. The `apply` way. Afaik. However, the syntax of JS primarily lets us *declare* and *invoke* functions with fixed arguments. The `call` way. Until ES2015, this was the *only* way to invoke functions *syntactically* (while the global `arguments` allowed JS to *declare* the `apply` way). Then the `...` came and allowed us to *syntactically* express the `apply` directly. The point being that there are *two* fundamental/syntactic/different ways to write invocations in JS code, the `call` way and the `apply` way. Call them *grammatical* primitives. You can't interchange them. `[1,2].splice(s, e, [3,4])` would fail (as in it would produce `[1,2,[3,4]]`).

Now. Because JS for so long *only* had a direct syntactical way to express function invocation using `call`, all the functions in JS was created so that one could *always* `call` them. Now, the use of the global `arguments` allowed developers to declare functions capable of being `apply`ed. But the rule in JS has historically been, and is now if we exclude `HTMLSlotElement.assign()` and `replaceChildren()`, that you can ***always* invoke browser functions them using `call`, and *optionally* invoke them using `apply`**.

Now, this is linguistically *huge*. Syntax for invoking functions are at the level of... quotation marks for strings and primitives and object and array literals etc. And turning *optional* into *must* at this level is... BIG.

To give a parallel. *Must* programmers use `class`? Or should "old-school" programmers be allowed to

more elegantly to syntactically declare and The syntax of JS supports *two* different ways to directly write how There are *two*

And I am stating that *yes*, if we consider *all* platform functions with variadic signature in the browser today (except ), this is *true*.

I still feel I must struggle to communicate the *weirdness* of `HTMLSlotElement.assign()`

```javascript
class HTMLSlot

```

> There is `Array.prototype.splice` that works exactly the same

`splice()`! Thank you for bringing it up, it is really relevant, in several ways:) But... And I (honestly) hate being the guy that is the stickler for details... `.splice()` also passes the "can it be `call`ed"/"voluntary spread" test faced with a sequence. It is one of the 99%. If I am not mistaken... Here is how:

```javascript
const sequence = [1, 2, 3];
const deleteCount = 1;
const position = 1;
const target1 = [1, 2, 3];
const target2 = [1, 2, 3];
const target3 = [1, 2, 3];

//nice `apply` way
target1.splice(position, deleteCount, ...sequence);

//the verbose literal, `call` way to expose the conceptual variadic inner loop of splice
for (let i = 0; i < sequence.length; i++) {
  if (i === 0) {
    target2.splice(position, deleteCount);
  } else {
    target2.splice(position, 0);
  }
  target2.splice(position + i, 0, sequence[i]);
}

//the more normal `call` way to get the same output, that would also be a more likely way to implement `splice()` 
target3.splice(position, deleteCount);
for (let i = 0; i < sequence.length; i++)
  target3.splice(position + i, 0, sequence[i]);
console.log(target1, target2, target3);
```

What can we learn from `splice()`? Well, first that we can combine a fixed length "head" with a variadic tail and still pass the "can it be `call`ed" test. Second, that this kind of mutation on another list, ie. the `this`-array used inside the `splice()` function, *do* complicate matters. Mutation adds complexity, no surprise. Third, but even if it is not pure mutation wise, but it can still be "pure" variadic wise (ie. pass the "can it be `call`ed" test).

And. The second parameter `deleteCount` is problematic. The `if(i===0)` test enables us to make the iteration pure, yes. We *can* extrapolate the variadic loop, yes. But it makes people understand it "the more normal way". I did too. The "iteration settings" paramters `position` and `deleteCount` make the variadic function seem more primitive than it conceptually is.

I do not think `splice()` is (that) bad. My guess is that the second argument is a good compromise between enabling efficency deep down while not breaking the "every native JS function should be `call`able" principle. I personally think `splice()` *benefits* from having a variadic interface, because it rightfully hints at the internal loop purity, however complicated the iteration algorithm is. But, I like variadic function that have as few as possible "iteration settings" parameters at beginning (ie. `position` and `deleteCount`). And so, if all else is equal, I think the principle should be not to have them.

While, on the topic, I would also like to point out that `Object.assign()` is similar in that it has another type of special first parameter.


> and sticking with [...], we have already concat which does that mistake, 'cause I am sure if it was proposed in 2021 it would've been just variadic, without the surprise concat brings today, used to flatten out as side-effect.


> Asking for an API that brand check if the first argument is iterable, makes list of iterables "impossible to deal with", so it's also bad as generic signature ...



and sticking with [...], we have already concat which does that mistake, 'cause I am sure if it was proposed in 2021 it would've been just variadic, without the surprise concat brings today, used to flatten out as side-effect.

> [...].concat(a, ...b, c) this is how concat would be a better API, imho, and the very same reason I think having dual behavior based on length and "iterability" is a bad precedent for the specs itself or, something we should run away from, instead of making APIs more ambiguous then these should be.

And thank you so much for replying to the 'polymorphy' in my initial post. Yes, I agree that 'polymorphic' can do that to a function, ie. "make it impossible":) And if it is the "special first argument" rule, yeah, that is the kind of semantic special case that can hit you in the face sometimes. Actually, the variadic function strives for the oposite. It strives for a world where the *same rules apply to all arguments, regardless of their position*. Yeah..

Ok, let us assume that argument-position-polymorphism is bad. What's the opinion on variadic polymorphism? Ie. that the same rule apply to all arguments, but that each argument can be different types? `console.log()` being an example. What if we took a page out of the `Array.flat()` and `console.log()` books and made a variadic `assign()` that would accept both lists and nodes. recursively flatten any sequence passed to it?

Ok. And then you suggested that a polymorphic alternative nr 2 would be bad too: ie. that to do as I try to throw another idea on the polymorphy-wall here (the idea being that *if* there is consensus that `assign()` is wrong, then which is the better solution to it?) What if we made `assign()` accept *both* sequences *and* nodes, at all arguments. Then, if it encountered a sequence, it would "flatten" it

Ahh. I see the misunderstanding. And I am sorry, it is my fault. If we could start from scratch, I also *prefer* a variadic version of `HTMLSlotElement.assign()`: a *good, real variadic* `.assign()`. And, yes, many such *good* variadic alternatives exists. The reason I have proposed the "variadic function to normal function"- change, is that I, at the beginning of this discussion, thought that it would be the least bad approach to fix the current *bad, not-really-variadic* `HTMLSlotElement.assign()` just shipped. But, I also *prefer* a true variadic version. For example:

```javascript
//good variadic `assign()`, echoes `.append()` and `.removeChild()`
class HTMLSlotElement {
  assign(...nodes) {
    for (let n of nodes) {
      this.#listOfAssigned.push(n);
      n.#assignedSlot = this;
    }
  }

  unAssign(...nodes) {
    for (let n of nodes) {
      const pos = this.#listOfAssigned.indexOf(n);
      if (pos === -1) throw new Error("probably shouldn't just ignore this");
      this.#listOfAssigned.splice(pos, 1);
      delete n.#assignedSlot;
    }
  }

  replaceAssignedNodesPrimitive(newNodes) {
    this.unAssign(...this.#listOfAssigned);
    this.assign(...newNodes);
  }
}

//then, inside the function that reacts to slottable children changes, you could do the following
class WebComponent extends HTMLElement {
  #slot1;
  #slot2;

  //bla bla bla

  callbackWhenYouNeedToCheckAndAssignChildNodesFromTheHostNode() {
    this.#slot1.unAssign(...this.#slot1.assignedNodes());
    this.#slot2.unAssign(...this.#slot2.assignedNodes());
    const lhs = [...this.children].filter(n => n.tagName === 'LH');
    const lis = [...this.children].filter(n => n.tagName === 'LI');
    this.#slot1.assign(...lhs);
    this.#slot1.assign(...lis);
  }
}
```

I should also probably explain how this *good* `.assign()` and the current *bad* `.assign()` differs.

First, the obvious:

1. both `assign()` have a variadic function *signature*.
2. the *good* `assign()` doesn't remove the previously assigned nodes, and therefore require a variadic brother `unAssign()`.
3. In the new *good* `HTMLSlotElement`, a third method `replacedAssignedNodesPrimitive()` is added. This should mirror the current, bad `assign()`.

Then, the "can it be `call`ed" test.

```javascript
callbackWhenYouNeedToCheckAndAssignChildNodesFromTheHostNode()
{
  for (let n of this.#slot1.assignedNodes())
    this.#slot1.unAssign(n);
  const lis = [...this.children].filter(n => n.tagName === 'LI');
  for (let n of lis)
    this.#slot2.assign(n);
}
```

Why does the *bad* `.assign()` fail the "can it be always `call`ed" test?

1. The *bad* `.assign()` first does a state mutation on the list of assigned nodes in the slot, a.o. This state mutation happens outside the loop of `newNodes`.
2. This means that if you try to add the new nodes one by one, then the *bad* `assign()` will at each step remove the new node that was added just previously.

And then things start to get problematic..

1. Because the `HTMLSlotElement` current provides no method for `unAssign`ing, and
2. faced with the, I dare say, *exceptionally important* use case where you need to call `assign()` with variable length list you make from `this.childNodes` or `this.querySelectorAll()`, and
3. only because `assign()` chose this particular quasi-variadic pattern, then
4. the developer is *forced* into a corner where the only way to invoke this function is the `apply` way.


5. And then, and only because `assign()` was designed in this particular *bad* way, ie. pretending to be variadic, but not really being that, then you suddenly are in a situation where you *must*  *not* because it is variadic that means that because the variadic function was designed in *one particular bad way*
6. That is a problem. Why? There might be cool application for such a function. Let The reason this is

#### Why `consistency[0] === "freedom of choice"`?

If the whatwg were starting with a blank slate of paper for `HTMLSlotElement.assign()`, they could create a new internally consistent system [six ways from Sunday](https://grammarist.com/idiom/six-ways-from-sunday/). Fine! They would have no developers to answer to. No established rules to comply with. They could decide freely what makes most sense, what is most consistent.

But, this is obviously not what **consistency** means here. JS has a rich history and lots of legacy to protect. The paper is not blank, the paper is filled with let's say ~1000 functions. So when whatwg is making function ~1001, then this function's *API/signature*, *behavior*, *requirements of the run-time*, and *requirements of its developer users* should be consistent with that of the ~1000 functions that came before it and that will co-exist alongside it. Let's agree to agree: **consistency is king!**.

So, is `slot.assign()` breaking consistency? Is it using a unique, unprecedented variadic pattern?

The discussion so far has mostly been about *precedent for true-variadic functions*. And this has been established, if there ever was any doubt. There are ~100 examples of good true-variadic functions in the browser. They are needed and wanted. By experts and beginners. Let's agree to agree #2: ***good* variadic functions are ok**.

But. This is **not** the issue with `.assign()`. The issue isn't variadic signature. It isn't spread. The issue is that `.assign()` a) is the only means to solve important use-cases (ie. primitive) and b) doesn't pass the "can it be `call`ed"-test ("voluntariness").

Is there precedent for:

1. a)? Yes. Lots! Many functions are primitives, especially in the DOM: `addEventListener()`, `append()`++. Let's say there are ~666 such primitive functions in JS. No problem. Let's agree to agree #3: **primitive functions are ok**.

2. b)? Yes, 1(!). `replaceChildren()` *also* doesn't pass the "can it be `call`ed"-test. So, we have ~99 true-variadic functions vs. 2 quasi-variadic. We have ~999 functions we can *always* `call`&`apply` vs. 2 functions we can *only* `apply` to lists.

3. a) and b) together? **No.** The only counter-argument here is that if you replace `replaceChildren()` with `remove()` and `append()`, there will be some difference in the mutation records and callback sequence/context. But(!) This doesn't mean that you cannot solve the same use-cases using `call`, only that you get different side-effects when you use different functions to achieve the same use-case. Which is... to be unfortunately? So, a "no".

#### Conclusion:

Precedent on:

* "you can **not** `call` that function on a list"? 2 of ~1001 ?!
* "you can **not** solve your use-case with `call`"? 1 of ~1001 ?!?!

Why? Why did the ~999 other native JS functions go the other way? What is it with this pattern? What will its consequences be? Maybe it's good even? Maybe we should add *more*, maybe ~200 of ~1001 functions should be "not `call`able with lists"? Maybe we can just forget-about-it, trust whatwg when they say that it is "fine" to make non-`call`able functions, and go back to sleep? No one is relitigating spread, or primitives, or whatever. The poor guy that is being taken behind the court house and shot for no apparent reason is not me, it's everybody's best friend: "all functions are `call`able".

This is a serious bug rapport. Please whatwg, take it seriously. Please, if there are others reading this that see the importance of the `call`able principle, please speak up. `HTMLSlotElement.assign()` has just been shipped. But MDN still documents it as if it were a `call`able function. And it is not yet supported in all browsers. The clock is ticking guys...

* `replaceChildren()`... It bugs me. When the magician takes a full glass of water behind the curtain, empties the water on the floor, fills the glass with M&Ms, says abracadabra, and then shows the birthday kids the glass with M&Ms to applause and anticipation of candy, then the adults in the rooms first thoughts are: "who is going to clean up all that water? and the wet glass is going to partially dissolve the M&Ms' glazing so the white, unwashable carpet the kids are sitting on will definitively be M&M colored...". Primitive as in caveman/M&M-magic-trick.

#### why is preserving "*always* `call`able" important?

### Internal consistency

We begin with an example: Imagine for a second that JS is a language like English. The functions are verbs; primitives and literals `{}`/`[]` are nouns; and the variables pronouns. Now, the function-verbs have different tenses: simple present is the `call` way; perfect present is the `apply` way; simple future is `call` with `await`; future perfect past is `apply` with `await`; and imperative is `new`.

Then imagine Webster's dictionary defining a new verb *and* at the same time simply saying that this new verb can only be used in present perfect and future perfect. I "have googled" that one (ok, present perfect). Hopefully, more people than I "will have googled" that one by tomorrow (ok, future perfect). No one else "googles" it (not ok, simple present). And whatwg "will not google" it (not ok, simple future).

Here, a new verb with a hard semantic rule *tries to* restrict a soft syntactic rule. The semantic and the syntactic rules contradict each other; the system as a whole is self-contradictory; this is internal **in**consistency.

But this isn't bad consistency, right? It doesn't really matter, right? For the computer itself, that is true! The computer doesn't care about soft rules. Or hard semantic rules for that matter. The computer will shift from one rule to the next in milliseconds. It is built that way. It is super precise. And very good at switching between rule sets.

That's good, right? That means we can just forget about it? We just change the soft syntactic rule, right?

Maaaybe not..

Individually, when you make up your own mind about it, soft syntactic rules *can be* changed in your own mind. And I believe that this process can *feel quick and easy* at the moment you make it and are conscious of it, but I also believe that this process begins long before and ends long after the *conscious moments of change*. It is more like becoming conscious of walking at the moment you jump over a puddle on a two-mile walk.

But collectively they are constructed by each developer individually as expectations form over long time use. It has been tried. Kings had heralds ride around on horses telling people what they could think and say. Programming languages do it all the time. It just doesn't work very well.

The human mind computer however, that is another story.

The human mind *assimilate* syntactic rules in the same way they learn to ride a bike. Syntax is only conscious up to a point, then it becomes second nature, unconscious. Some of these rules are self-evident. You can see the `+` and `=` straight in the code, and they always remain semi-conscious because you can see them. Others, such as the *implied* outerArguments in `call`, the difference between `call` and `apply`, and "you should be able to `call` all functions in JS" are invisible, often learned by trial and error, forgotten, or other-wise sub-conscious.

Semantic rules are somewhat different. They only apply to each word, and so unless you use that word often, your mind doesn't get drilled in them the same way syntactic rules are, and so they are more likely to be *forgotten*, *remembered*, and not internalized as deeply as syntactic rules. (That is not to say that rarely encountered syntactic rules also gets forgotten and must be remembered. Often:)

So, what happens in the monkey/human mind when it stumbles upon a verb/function with a mismatching soft syntactic rule and a hard semantic rule? First, neither the English speaker nor the programmer is likely to encounter it in manual Webster/MDN. He/she is most likely to meet it out in the wild, written in somebody else's code or suggested by his IDE. He will try to use it, not being warned about the contradicting rules. And *then* he will encounter a bug/correction.

For the language user, the bug will immediately catch his attention. He will be forced to fix "it", the socially awkward situation or the function with the buggy code. He will spend time. *Before* the bug has been understood, the user will not know if the contradiction is caused by his use of the language or the language itself. The syntactic rule is likely to be subconscious and the semantic rule not necessarily easily recognizable. He will likely trust the system: the system has worked *hard* to instill in its users this trust, ie. the belief of its users that the system knows best. And so the user will *first* expect that the contradiction is due to something he/she has done. He will try to find out how he must change his language to fix the problem, and then learn the new semantic rule.

But then comes a second stage. In order to fix the bug, the user must apply a semantic rule that contradict a syntactic one. Fixing the bug will mean either deep or superficial *learning* of the two rules, and when the user puts these two rules into his idea of the system at the same time, the meta-bug arise. The human-monkey brain doesn't like learning internally inconsistent, self-contradictory rules. It is not like a computer. Something still *feels off*, something *smells*.

Now, for a self-confident, expert user of the language, rare, this is likely to stir his/hers curiosity. "Wow! What is going on here?!?! This I must investigate!". For a not so confident, average user, frequent, this is likely to stir a) uncertainty about what the real problem is and if the chosen solution is correct, b) doubt in his/hers own mastery of the language and the syntactic rule that came into conflict, and c) fear that such a problem will arise next time he/she goes here again, or in the next task.

Very few users have the privilege to spend the time needed to pursue such a meta-bug till its conclusion, as I am doing in this bug rapport. Most users will leave the situation thinking either:

* ok, the system is a bit off again, it added yet another special case here, I now got it, my colleague in the next cubicle don't, I will flash this medal infront of him and my boss the next chance I get, or
* Why can't `assign()` be `call`ed like `append()`? Or `push()`? Why has the browser *chosen* a different pattern here, a pattern that contradicts one of my soft syntactic rules? I thought I always could `call` functions? I thought `...` was still voluntary? And I trust the browser and whatwg: they have a bunch of guys working loooong and hard to find the right solution to every little problem. Mozilla is there to make sure things stay on the up and up. I trust the experts to know both mine and other peoples' use-cases, and find the best solution. I trust that whatwg know the syntactic norms in their system better than I. So, Why now, and in this use-case, is the browser *choosing* to demand that I use `...`, when it up to now has always only *asked me politely* to do so `...`? And I don't see any reason for it. I don't see *why* it wouldn't be better to just follow the precedent set by `append()`? I don't see what can be so good about this *new* way that it should break with the
  principle that everything can be `call`ed? What is it that *I* still don't understand? What is wrong with *my* thinking?

**Trust** in others has the unfortunate side-effect that it can make you doubt yourself, erroneously, needlessly. But trust can also be lost. And I think that it should be self-evident from my contribution here how a platform looses the trust of its developers.

But. Things can gets worse. If **internal consistency** is all we care about, **internal consistency** can be re-established by simply nullifying the syntactic rule that "all native functions can be both `call`ed and `apply`ed". We can replace it with a new syntactic rule that says "all native functions can be `apply`ed, most native functions can also be `call`ed, but some native functions can only be `apply`ed". No problem. It's "fine". The syntactic rule is *soft*. And the developers of the native functions have that power. "Voluntariness between `apply` and `call`" is... dead.

If `replaceChildren()` establish precedent for `assign()` (I disagree, but whatwg says so), then *both* `replaceChildren()` and `assign()` together would set *more than twice* the precedent for bug#3. And, so if not "bug!" is declared openly, explicitly, then soon enough quasi-variadic functions are cast into the platform to kill the rule "you can always `call` and `apply`". We can still save face, keep trust, *and* restore internal consistency: let's pretend there is *no rule-change*, diss "voluntariness", and hope this thing goes away on its own, as nobody seems to neither notice it nor care about it but this weird, random guy, who, btw. keeps blabbering himself into oblivion :)

    no longer a concern.    This contradiction *can be removed, without changing the semantic rule*. If more functions are added that often cannot be `call`ed, then *more* precedent will contradict the "all functions can be `call`ed" syntactic rules. And this being a *soft* syntactic rule, the rule dies.  then yes "voluntariness" is dead. The syntactic rule that said "you can always `call`" no longer applies to JS. What does this future look like? Imagine you have a group of beginners. You are tasked with teaching them to use functions in JS. But now 5% of JS functions can *only* be called using `apply`. Now you must not only teach the `call` way with `plus(one, two)`, they should not leave your classroom until you have taught them `...`. It is not about typing three `...`. It's about understanding them, remember them, guessing them for those that already struggle to remember `var`, `await`, `extends` and so much more.


    At least experienced users who do not encounter such problems  What ,   what the system woul, the  Something "smells", "feels wrong". The language user is not conscious about the syntactic rules, and cannot immediately pinpoint *what* the internal inconsistency/contradiction *is*. The user has to investigate. Think about it. Make it conscious. The contradiction grabs our attention. It takes a few minutes. The conflict stirs the curiosity (of self confident expert users/rare) or fear, uncertainty and doubt (not so confident normal users/frequent) - curiosity/fear that something might be discovered/wrong. We can't help it. This is what internal conflicts do in our monkey brains.

    In this particular case, the users should not be able to find any rationale behind the conflict. He will be left with the thinking: "" Now, confident users will be intrigued. Or simply dismiss it as just another thing to know, a medal on my chest that others can't show. Very few users will be able to *consciously* resolve this conflict the way I am doing in this bug rapport. Most users will either give up or patch through using examples from stackoverflow, MDN and google, and leave with a vague or strong sense that there are internal contradictions in "my own" understanding of JS rules (when the monkey-brain not recognizing that the contradiction is in the platform, needlessly, will doubt itself/fear the situation). And, seeing this uncertainty in the eyes of the doubtful beginner *will* perversely boost the self-confidence of the expert looking on from the outside
    
    And so the user must spend time identifying what the conflict is and trying to resolve it. the conflict IMHO.  The internal inconsistency will *bug* the users "estethic" senseability: the mismatch between the two rules will deep down in the reptile or monkey parts of the brain cause a conflict that the user cognitively must process before continuing. The user cannot *before* having reviewed the conflict *know* if the contradiction is because he has done something wrong, or if the contradiction is "ok" because it is part of the platform. The hard semantic rule vs the soft syntactic rule will "smell", is "ugly", "feels off". The cognitive engine of the mind is instinctively built to try to resolve such conflicts when it encounters them, instincts known as curiosity a.o., and  "Voluntariness between `apply` and `call`" is **JS syntax**. Yes, you *can* add a semantic rule that contradicts this, as `.assign()` does. But this rule will *always* contradict the deeper, syntactic rule. There will be no peace, even when I stop posting, which I will. 

### Experts design systems for idiots

I have mentioned this before, but nobody seemed to pick up on it. "Experts design systems for idiots, idiots design system for experts". (I am not accusing anybody of being an idiot, I am simply trying to make us all remember some basic tenants of good interface design.)

Another good tenant is: "if you can, design the system so that as many users as possible can use it without a manual". Self-explanatory. If knob one on the faucet turns right, make the knob two turn right. If function `push()` and `append()` can be `call`ed, then make `assign()` `call`able.

Third: *be inclusive*. If alternative 1 can be used by wheelchair clients and walking clients, then don't choose alternative 2 because it has flashy staircase. You never know when you the store owner might shoot yourself in the foot;) There might be *no compelling reason* to temporarily exclude the wheelchair users while they recover/learn. And some people in wheelchairs maybe can't/won't.

But ok. Let's look at `HTMLSlotElement.assign()` in particular. From the viewpoint of the export and the beginner.

1. Expert. I think that the expert is best served with "no-manual". If the `assign()` copied `append()`, that would be most likely. But. The expert is also likely to be thrown by the quasi-variadic pattern. The expert will see the variadic function signature, and think that it represents the same *nice* behavior as all the other *good* variadic functions (except `replaceChildren()`). The expert would more easily recognize the *primitive* nature of `.assign()` if it was presented with a normal `call` signature. I think the expert would be best served with a true variadic `assign()` and `unAssign()` brothers, but if the platform *must* control this use-case as a primitive, then that should be signaled by passing the sequence in as fixed-length first parameter. After all, adding `[]` around `[one, two]` is even one letter shorter than writing `...`.
2. The beginner. How many JS beginners learn to `call` functions with fixed-length parameters *before* they learn to `apply` them using `...`? Ok, I believe 100%, but I am fine with saying 95%. How long is the period where the beginner only knows how to `call`? Two weeks have been suggested. But I think that maybe a year is a better yardstick. Most people that learn programming, or at least that will do so in the future, will likely be of a different category than the super interested, I-am-programmer-identity, top-of-the-class students. Why not give them an interface that they will be comfortable with, and that the same time will show them how "variadic" works when they themselves find that they are ready to branch out into a second invocation syntax/use a different verb tense. Here it looks like whatwg could benefit from more data/evidence

In this issue we are discussing the best interface for `HTMLSlotElement.assign()`. This is important because it is a very useful method (I am only here because I care guys:). And because if there is something seriously wrong with it, we need to know about it to fix it (update it) and avoid doing the same mistake again (precedent).

There are two user groups that

### Complexity is death by a thousand cuts

5. For experts **false advertising** for experts. When a function presents itself with a variadic signature, that the function signals potential for *internal true variadic behavior*. Sure, you can  *might be* true variadic. Based on my experience with the other ~hundred~ examples of variadic signature his intuition tells him that this function *should be* "true variadic". When a function's signature is variadic, then there is the potential for , that expect a function with he expects
6. **freedom of choice**. As opposed to "'voluntary test' is something you created, and not part of how we design APIs". This statement breaks with what I believed was the policy of JS and web, I thought that for example the 'voluntary test' was important for prototypes vs. classes. Is it not? Is it not a goal for the whatwg API designers to at least *try* to make the API usable *both* using prototypes *and* classes alike? Isn't this the same "voluntary principle"? Even if you say you don't, I think you do. So, does whatwg not recognize that the freedom to choose between `call` vs. `apply` is everywhere in its platform, that whatwg themselves have *created* this "voluntariness" in their own platform? Does whatwg not recognize that `call` vs `apply` is a deeper syntactic concept than `prototype` vs. `class`? You can meaningfully use a lot of JS with functions, but without `class`es nor `prototypes`, but not vice versa.
7. **inclusion**. "Our mission is to ensure the Internet is a global public resource, open and accessible to all. An Internet that truly puts people first, where individuals can shape their own experience and are empowered, safe and independent." [Mozilla mission statement](https://www.mozilla.org/en-US/mission/). This is why we are here guys. This is our ethical, moral compass. All else being equal, under this banner we the free folks gather. Asking people to learn *while* they use a function is fine! Asking people to learn *before* they use a function is excluding them *temporarily*. Even "temporary exclusion" must justify itself. And we all know, "temporary" is never only "temporary".
8. **developer recruitment is king**. Low bar for entry. Commercially, and culturally, recruitment is king. *FB* is "dying" because it is *growing* slower than snapchat. Schools in Norway are choosing either JS or Python when they are now going to start teaching *every kid to code*. In 10 an entire generation of Norwegians will most likely know *some Python* or *some JS*. In 50 years let's say 3 billion people will have been taught some programming in school.
9. **complexity is death by a thousand cuts**. The *rosy* argument "everybody learns spread in two weeks". "it is fine that the platform demands learning (even when the pattern that adds the requirement is both unnecessary and cause confusion)". Here, there *need* to be some evidence. And, I think I know where it can be found, although I am not an expert here. In school, kids learn to use and make their own `call`-style basic math functions. How long does that take? I asked a Swedish math teacher for his answer: his immediate response was: "in general or the good ones"?
10. **Idiots build systems for experts, experts build systems for idiots**. I am not saying anyone is an idiot for making a mistaken, but if one makes a mistake and then refuse to own up to it/understand it, then there is a problem.
11. You can think of this as logical consitency if you'd like. The legacy of JS is that it *can be* used without `...`.  
    ()

This legacy is , not just looking back but also looking into the future. But we start by looking backwards, for the sake of .

Let's say that there are 1000 functions in JS

But. In the JS code where a developer "call" the function, the "normal" JS syntax is based on of `function`