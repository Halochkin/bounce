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


### 
Hi,

hm.. ok. first of, i think i need help from some actual JS journalists

second. I don't really want to send you this request.. I am not really much of an out-in-the-media kinda guy. But. I think this time maybe I should. So, if it is possible for me to ask you to treat me like a source, I would greatly appreciate that :)

third. That last point sounded like I have way more juicer stuff than I do. So don't get too disappointed.

forth. the thing. I think we are about to stumble over a syntax antipattern that the browser is currently pushing. And I sent a 'bug-rapport' about it to whatwg, and they keep telling me its nothing. But. I did this analysis of the bug. And wrote a tutorial. And it won't go away. And I think it kinda sets a bad example for future functions. And that maybe we should still try to fix it, since its there.

The whatwg discussion is here: