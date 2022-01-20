I propose to make the `HTMLSlotElement.assign()` method accept a sequence of nodes as its first argument, preferably as a polymorphic feature that coexists with the current variadic design.

### Background

1. [Previous discussion](https://github.com/whatwg/html/pull/6561#issuecomment-826391595)
2. The [spec](https://html.spec.whatwg.org/#dom-slot-assign) defines the `HTMLSlotElement.assign()` method as a variadic function that accepts a list of 1 to many `Node`s. Both Firefox and Chrome implement this behavior according to spec.
3. [MDN 11.9.2021](https://developer.mozilla.org/en-US/docs/Web/API/HTMLSlotElement/assign) describes `HTMLSlotElement.assign()` as a function accepting a sequence of `Node`s. (I think earlier implementations of Chrome also did this?)

The current variadic `HTMLSlotElement.assign(...nodes)` method looks good for experienced JS developers and works well. The (old/MDN/sequence) version of `HTMLSlotElement.assign([nodes])` also looked good and worked well.

### Why not change?

The two functions work almost identically. It is `...` vs. `[]`.
* `slot.assign(node)` vs. `slot.assign([node])`
* `slot.assign(...nodes)` vs. `slot.assign(nodes)`

### Why change?

Here are my assumptions:
1. *Many* use-cases *must* pass a sequence of nodes to `HTMLSlotElement.assign()`. For example, if you build a web component for a custom `<ol>`, you will do something like this: `slot.assign([...this.children].filter(el=>el.tagName === 'LI'))` or `slot.assign(this.querySelector(":scope > li"))`. The same goes for a custom variant of `<tr>/<td>`, `<details>/..`,`<select>/<option>`, etc. With the current spec, this requires either `...` or reflection `Function.apply(...)`.
2. There is a common sequence in which people learn the JS programming language. People commonly learn "more normal" JS syntax such as calling object methods and making literal arrays `[]` *before* "more advanced" JS syntax such as variadic functions and the `...` rest operator.  
3. There are many "more advanced" JS developers that will use `HTMLSlotElement.assign()` and for them the difference between variadic parameters and a single sequence parameter is insignificant.
4. But. There are *also* many "more normal" JS developers that need to use `HTMLSlotElement.assign()` for whom the variadic parameters and/or rest operator will be unfamiliar and for whom this "more advanced" syntax can cause uncertainty, frustration and errors. Thus, for these "more normal" JS developers, there is a significant difference between the two alternative signatures.

IMHO, the argument boils down to:
1. What is *actually* the difference between variadic parameters and a sequence parameter? For example, there might be other considerations such as variadic parameters excluding a possible `options` argument in the future.
2. How big will the group of "more normal" JS developers using `HTMLSlotElement.assign` be? Will users of `HTMLSlotElement.assign()` be 342 "more normal literal array guys" vs. 5 million "more advanced spread guys"? Or will more than half of users of `HTMLSlotElement.assign()` be uncomfortable with passing sequences to variadic function using the spread operator? 

### Suggestion for solution:

I personally like the variadic API. I just think that the use of the spread operator should be *voluntary*. One alternative approach that would accomplish voluntariness would be to make `HTMLSlotElement.assign()` polymorphic: *iff* the first argument is a sequence, then `HTMLSlotElement.assign()` would work as MDN describe, otherwise run as the spec describes. (illustrated in the below monkey patch).

```javascript
const desc = Object.getOwnPropertyDescriptor(HTMLSlotElement.prototype, "assign");
const og = desc.value;
desc.value = function assign(...args) {
  typeof args[0][Symbol.iterator] === 'function' && (args = args[0]);
  return og.call(this, ...args);
}
Object.defineProperty(HTMLSlotElement.prototype, 'assign', desc);
```

### Side note

Is there a style guide somewhere that describe which syntactic features of JS a developer should *not* be required to know *before* he/she can use all platform functions? There are other examples of variadic functions such as `Object.assign` that in more edge-case uses might require `...` or `.apply`. So, it is not completely unprecedented. But I can't remember any other platform function that so clearly *demands* the use of the spread operator for its *main uses* as `HTMLSlotElement.assign()` does.


 

PS. My arguments here are made on the assumption that the two alternatives are otherwise more or less identical. They might not be. If so, please correct me :)   

Or did you mean that it is fine because there are some other non-stylistic concerns that guided the decision? Are there any reasons you chose variadic function and rest operator over the initial proposal? performance? functionality? 

Or did you mean that it is fine because the assumption is that only experts will use the `HTMLSlotElement.assign` method and they are fine with the spread operator? But that would be the same as saying that making slotting web components should be the terrain of experts. And although I don't necessarily disagree with that sentiment and the reality behind it, I also do believe that if you tell a guy not to play around with the `<slot>`, he *will* play around with that `<slot>`.

There are reasons to choose the variadic design, but there are also reasons *not* to choose the variadic design. The reasons *not* to choose the variadic design. And 


I am sure there is a reason here, but it would be And here I am not quite sure what you meant by "it's fine". Do you mean:

1. It is fine because we assume that all JS developers are comfortable using it.
If the assumption is that novice JS developers are "fine" with spread and variadic functions, do we have any data or statistics to back up that assumption? 

But, I am not sure I quite got the finer details with your answer to the language and syntax issue. Can you please help me understand:)

When you say "it's fine", do you mean:

. Great answer btw) 

Or, is your point with "it's fine" to say that `HTMLSlotElement.assign` is such a complex method that beginner and Joe should be guided away from it 

Even more basic. Have you done any tests in the office? Have you given fellow experts the name of the method and a use case and some half finished examples and said: "try to assign those nodes into that assign method" and seen their expert guesses? My guess is that not that many experts with experience with other JS DOM methods would start with the spread operator, unless they wanted to look "clever" that is.

And if there is no data, how many of the experts truly remember what it was like to be a beginner? If not, is the `HTMLSlotElement.assign` such a complex method that beginner and Joe should be guided away from it? If not, do we want to use a DOM node method to force Joe to learn syntax he/she previously has avoided? If you are making a product for idiots, then you must try to avoid designing it for experts. We are all idiots. Most of the time... Especially when we are designing our systems first and foremost to be used by experts. Or thinking that our system will not be used by idiots.   

required syntactic form to  off limits? My point is, to an expert JS developer, the difference between the 

And if all else is equal (between the three extra dots `...` vs. the extra square `[]`(which would be good with a response too)) is the spread operator known by... its users?   is



I think everybody in this forum will agree that the spread operator is "fine", even elegant. However, my point is if whatwg should consider the spread operator "known" by average Joe JS developer? And do whatwg have any statistics/data to back up those assumptions, ie. JS developer skill statistics? I will again stress that for me, the spread operator is fine. The question is: is it fine for the beginner JS developer too? Or would the literal array be a better choice if one considered the needs of beginner programmers? 

"What is the (future) use-cases for `HTMLSlotElement.assign()`?" And when we look at these use-cases, in how many of those use-cases do you have: 
1. individual variables for each node being slotted in (which is ideal for the variadic spread variant), or 
2. one variable pointing to a sequence of nodes (which is ideal for the MDN sequence variant)?

To predict the future is hard. But, if we look to the past and the *native HTML elements*, they *do* provide us with a couple of use-cases for `HTMLSlotElement.assign()`:  
1. `<ol>` and `<li>` as I described above.
2. `<details>` and `<summary>` and the rest.
3. `<table>`, `<tr>`, `<td>`.
4. `<select>` and `<option>`.

In each of the four use-cases above you would need to "slot in" a filtered list of `this.childNodes` or `this.children`. One can make this list in many different ways, but common to all is that one will *not* have individual variables per node in the scope, quite the opposite. Below is an example of how these native element use-cases would need to be met: 
1. `slot.assign(...this.querySelectorAll(":scope > li"))` 
2. `const sum = this.childNodes.findIndex(n => n.tagName === "SUMMARY");`
   `detailsBodySlot.assign(...[...this.childNodes].splice(sum, 1))`
3. `rowSlot.assign(...this.querySelectorAll(":scope > li"))` 
4. `options.assign(...[...this.children].filter(el=>el.tagName === "OPTION"))` 

Alongside these four use cases are also some individual node variables being slotted such as `<lh>` and `<caption>`. Which also would require `.assign()`. So I am not arguing one over the other, I am saying that *both* 1) "variables pointing to individual nodes" and 2) "one variable with a sequence of nodes" are *main* use cases for `.assign()`.

If we are making a guess, my guess is that we would be surprised faced with real data. My guess would be that the average JS developer has been coding for a few months, not years. That his skills are much more tentative and fragile than that of the whatwg participants. That his reach into the platform is much more random and deeper than one might think, thanks to copy-paste and stackoverflow. And that *a lot of potential* is lost due to a mismatch between the skill set and workflow that is expected of the developer and the reality that is JS development. 

Are there any advocates for _beginner_ JS developers in the whatwg? Have anybody considered the beginner developers interest here? If there are any newbie developer advocates in whatwg, they should be noted about the decision to require the spread operator in a DOM object method. They should be noted that now, the spread operator is "fine".

the `HTMLSlotElement.assign()`, the spread operator might start spreading. And then everybody would have to use it, all the time.  ;)  

The  is a little bit of a tricky argument. It is of course a little bit difficult to predict the future, but I think that the best place to  

And do whatwg have any explicit strategy as to what language features it should *require* from its developers? And in what areas? For example, it might be ok to have the spread operator be a requirement for Reflect API, but not in DOM methods.

The idea here is that we should try to make the basic system as simple as possible for both beginners and experienced developers. If all else is equal for the experienced developer, then why not choose the solution that fits the beginner developer best. Saying that the spread operator is "fine" implies that "beginner JS developers must know the spread operator to use a regular DOM Node method". I am asking if this is the assumption of whatwg? 


And yes, this is sweating the details:)

And how big a percentage of the users of `HTMLSlotElement.assign()` that use it? If the assumption is that 99% of the likely users of `HTMLSlotElement.assign()` are comfortable with the spread operator, then we are all good. But then I think that this assumption should be made explicit so that it is easier to verify.  

toast(...p, ...j)! I think that most likely all participants in this discussion will think that it is a fine language feature. We are all clever. But the question is:


1. what percentage of  thinks how many of the **users** of `HTMLSlotElement.assign()` is likely to **not** to think that spread operator is a fine language feature? (does anyone have any data here? does anyone know what features of the platform annoy average Joe JS developer the most? Which features cause the most bugs during development?)
2. In the case of the spread operator, if that number is bigger than we assume , would 


## on language and syntax

On language and syntax. My point is not a general assessment of the spread operator. That's fine! I even find it elegant... and functional... And I am sure that most JS experts in this forum feels the same way :)

My point is: is the spread operator "fine" for the **beginner**? Is average Joe JS developer comfortable with it? Will he use it? will he understand it when he uses it? And if not, will it cause poor Joe unnecessary frustration? will it cause bugs? will it make Joe give up on his first attempts to make web components, quit JS, and thereby rob the world of that 100th version of that same web component that would have sequestered carbon?

I think there is a proverb that says something along the lines of 'idiots make systems for experts - experts make systems for idiots'. I don't know if a variadic `HTMLSlotElement.assign()` is for experts, or should be, but it feels a little bit "too clever" when one *must* use the spread operator with it.


Thank you both for pointing out a) the need for evidence and b) that `append()` and `prepend()` also uses the spread operator!

### `append()` vs. `assign()`

The `append()` is an excellent reference. `append()` and `assign()` do similar tasks. But... There is a slight difference between *how* `append()` play with the spread operator and how `assign()` does it. `append()` simply *pushes* a node to a list; `assign()` *overwrites* the list. This means that with `append()`, you can do this:

```javascript
for (let node of sequenceOfNodes)
  element.append(node);
```

while if you try the same with `assign()`, you assign only the last node:

```javascript
for (let node of sequenceOfNodes)
  slot.assign(node);
```

The consequence is that the use of the spread operator is *voluntary* with `append()`, and *mandatory* with `assign()`. 

### evidence

If anyone was in doubt, I have _no_ evidence! :) I _only_ have anecdotes and a hunch that the *mandatory* use of spread operator *might* cause more confusion than we might think. The question is: does anyone have any evidence? Does anyone have any data that says something about which syntax is more or less difficult for the average users of an API function?

And. I think that the burden of evidence is on the other party here. Can anyone point to *any other* API method/function related to the DOM that *require* the use of spread operator? (The precedence for *voluntary* use of the spread operator with DOM methods being excellently established by the `append()`).

If there is *no precedence* for *requiring the use of the spread operator of JS developers working with the DOM*, then it would be good if the developers adding that requirement of all the other developers could either a) explain why we *must*/*should*/*benefit* from adding this requirement or b) could point to some evidence why "it's fine" for average Joe/beginners.
           
Again. All for the spread operator. Using the spread operator with the  `HTMLSlotElement.assign()` might be perfectly fine, when its users as a whole is considered. I just think that people are missing the point. The complexity of the system is "death by a thousand small cuts", and I think that this might be one such paper cut that we might avoid. 

First, I agree that if the `append()` and `prepend()` methods *can be used with* the spread operator, then it would most certainly be ok that `HTMLSlotElement.assign()` *can be used with* the spread operator.

But. And I am sorry for sweating the details here, but there is a slight difference between in *how* `prepend()` and `append()` *relies on* the spread operator. Please indulge me, if nothing else the difference is documented for posterity.

1. The `append()` and `assign()` do a conceptually related operation. It is natural for developers coming to `assign()` to use what they already know from `append()`.
2. So,
   very much the same thing.
   I actually tried to employ the append/prepend-pattern when I was faced with the updated version of `HTMLSlotElement.assign()` and an MDN documentation that was out-dated.

### How to gather evidence?

To try to help out, I set up this method by which evidence might be gathered.

1. Make a simplified pseudo use case. Example given below:

```html
<ol>
   <li>hello</li>
   <li>world</li>
</ol>

<script >
   customElements.define('ol', class OL extends HTMLElement{
     
     #slotHeader;
     #slotItems;
     
     constructor(){
       super();
       this.attachShadow({ 
          mode: "open",
          ____ : "manual"    //1. what should this setting be named??
       });
       this.shadowRoot.innerHTML = `
<div style="margin-left: 10px">
  <slot id="slotHeader"></slot>
  <slot id="slotItems"></slot>
</div>`;
       this.#slotHeader = this.shadowRoot.getElementById('slotHeader');
       this.#slotItems = this.shadowRoot.getElementById('slotItems');
     }
     
     onChildChanged(){
       const slottables = this.children;
       const lh = slottables.find(el=>el.tagName === 'lh');
       const lis = slottables.filter(el=>el.tagName === 'li');
       lis.forEach((li, i) => li.setNumber(i+1));
       //2. How would you assign lh into this.#slotHeader? 
       //3. How would you assign lis of items into this.#slotItems?
       //   Tip: you only have one method on the slot called 'assign()' 
     }
   });
</script>
```

2. Ask different groups of developers to solve the use-case.
   1. The experts one would ask for *multiple, alternative* solutions. And one would most likely like to see which solutions and other patterns they try first.
   2. Less experienced developers might be happy giving just one solution/idea. 
   3. With both groups, one could also provide them with documentation for the different alternatives and see which alternative they prefer *with* documentation.
   4. Or something along those lines. The main issue I foresee is that of representation. 
   
To my eyes, the output of such tests would be truly fascinating. And I think that all participants in this forum would like to see such data too:) If you already have such data/evidence, please let me know! 

The problem is that this process *still* done informally in the working groups and among browser developers, which primarily considers the needs of the expert, and not the needs of the beginners.    

The use case I set up above is very narrow, that might be more suited to less experienced developers. You could also add 
Let's say we are making a method. Such as `HTMLSlotElement.assign()` and we are faced with two alternative function interfaces: variadic vs single argument sequence. One might then make a simple test use case, leave out some black holes and do a questionare to see how people would *approach* the function/method.

For example:

upon which 
To get this discussion going in a more productive 


`replaceChildren()` and `Math.min` are other excellent examples. Thanks:)

But. They still pass the voluntary test, no? The use of `replaceChildren()` can be replaced by other DOM methods, (`remove()` and `append()`). So while `replaceChildren()` *do require* the use of the spread operator when working with a sequence variable, the *use* of the method is still voluntary for all usecases?

And. This same voluntary test can be applied to `Math.min` and `Math.max` (and `Object.assign()`)?
```javascript
let min = numbers[0];
for (let n of numbers)
  min = Math.min(min, n);
```

That is not the case with `assign()` and a sequence... Here spread is *mandatory*.

I see the shipping argument... And my original polymorphic option might not be good (I had kinda hoped somebody would slaughter my polymorphic alternative, so that I could feast in its remains too:). But, regardless of the outcome of a potential polymorphic slaughter, there are other alternatives too: add a new `HTMLSlotElement.assignNodes(sequence)`. Again, this has drawbacks too (two sibling methods in the API is not simpler for the developer than just one).

But. The problem with "actual developer skills" and "neccesssary developer skill" I feel is a symptom of a larger issue. It alludes to a problem of process, not only product. I am not sure that I mange to explain it without being perceived as offensive. So please excuse my French here, this is just a way to view what is happening, I am not saying that this is what has happened/reality:

Let's assume that:
1. whatwg don't know how large a share of developers know what JS (Case in point: the spread operator; It might be 20% or 2%. Or it might be 50% or 0.2%. We have different hunches, but it looks like there is no evidence).
2. whatwg is fine with *not knowing*.
3. whatwg make new API methods that require a particular skill set of its JS developer/users. In different working groups.
4. Sometimes these working groups' hunches are off. Maybe the members of the working group believe or feel that "the developers" **should** know something in order to use their API. (not *must* because of technical or other requirement, but *should*).
5. New API are made and shipped. And reality hits: only 60% of its users meet the required skill level. A _silent minority_ of 40% cannot use the API out of the box due to lack of skill. 20% strive to learn and manage (with time spent and bugs and broken eggs along the way). 20% the users _fail_ and fall behind.
6. The group of users are 20million. The number of developers suffering or being excluded are as many as the nation of Sweden. 
7. The decision to add a requirement was unnecessary. An alternative API which would not have this issue was discarded  and b) made on the stylistic preference of the members of the working group.
8. And then repeat this process for *all* new API.


Thanks! I didn't know that `replace X with Y` was considered a primitive operation. And just to make sure that I understand you correctly: by "primitive operation" you mean that to `replace X with Y` is considered a different concept than/non-replaceable with `first remove Y, then insert X`, right? I like the point, but maybe the details here is another deeper issue? I think that for the purposes of this discussion, the two alternatives can be interchanged often enough not to make `replaceChildren()` be considered *mandatory*. IMHO.

And again... sorry... the `DocumentFragment.append()` still passes the voluntary test as it pushes, not overwrites its target. As described above.

```javascript
for(let n of nodes)
  this.shadowRoot.append(n);
```

However. You are unsure of what you can tell me. So I should maybe be more direct in what response I would like from whatwg representatives on this issue:
1. What other (non-super-technical, non-edgy) use-cases for DOM manipulation *require* the JS developer to use the spread operator?
2. Are there any non-stylistic reasons to choose variadic over a single sequence (as described by MDN)? Is it only `...` vs `[]`?
3. If there are no other such use-cases, do the whatwg consider adding this requirement breaking with tradition/inconsistent with previous developer requirements?
4. And if this is *adding* a new developer requirement, what data/arguments/considerations did/do the whatwg base this decision on?

My answers are still:
1. none so far
2. none so far 
3. yes, this is a break with tradition/inconsistent. If viewed in isolation, this question has only one answer, I think. I also think that this is a super important thing to try to remain consistent on. 
4. Genuinely curios and interested :) I also think that "adding requirement" should be based on something other than "we like spread". Hey, I like spread too! The point is of course that no new requirement is always way better than nice new requirement. 

 I think that the API is still fresh enough to warrant discussion (the documentation wasn't/isn't ready).  If I have contributed to that, I am sorry. If I can make one personal request, it is also that the representatives of whatwg would help me and try to argue *both* sides of this question. I think that *if* "things I should know" list, this is a valid issue to be considered from several sides. And, again, I have no personal stake. Personally, I am fine with the three dots... and square`[]`. 
 

