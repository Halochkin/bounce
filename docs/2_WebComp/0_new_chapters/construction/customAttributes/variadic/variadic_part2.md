## How to write consistent API functions without "wat"s

### What's a "wat"?

"Wat" is slang for the ["only proper response to something that makes absolutely no sense"](https://knowyourmeme.com/memes/wat); "wat" expresses a sensation of confusion or bewilderment on the part of the utterer. "Wat" is commonly used to express *deep, fundamental* confusion: "wat" signals the breakdown in communication, and a "wat" must be fixed before communication can resume. Such deep confusion is almost always funny to observe.

In programming "wat" reflect the same type of deep confusion. One such common confusion is complete surprise or inability to comprehend a semantic and/or syntactic rule or a self-contradiction of such rules. The ["wat"](https://www.destroyallsoftware.com/talks/wat) talk by Gary Bernhardt is a good illustration of such deep semantic and syntactic confusion, as it is experienced by the programmer. "Wat" is not exclusively associated with semantic or syntactic rules, a "wat" moment can also be associated with the positioning or naming of a file/data in a system, system architecture, the behavior of a system, etc., but in this article we will exclusively focus on the concept of grammatical "wat"s as illustrated by Gary Bernhardt.

## Why "wat" matters?

For the person experiencing the "wat" moment, the experience of cognitive dissonance can be strong. "Wat" can be powerful and strong and evoke emotional pain, laughs, anger, and even shame. Why? How come a seemingly insignificant misunderstanding of technical details cause such emotions?

For the human caveman the ability to reason was *very important*. By reasoning that a rabbit hole has three exits, the human could block one, smoke the second, and catch the rabbit from the third. As lions stayed in the tall grass during the day, the caveman could walk safe from the lions on the hillside. But, how should the caveman react if he discovers that a new rabbit cave has four exits. Or seeing a lion strolling along the hillside? Such discoveries are not *unimportant*. What if the lion can appear elsewhere? , this constituted not only *new* learning, but also uncertainty about the other related views of snakes on the hillsides, and bears in the high grass, and squirrels always running up trees when confronted with smoke. A discovery when bears in the hillside   The language engine of our cognitive mind is deeply connected with our ability to do logical reasoning. We use the same brain cells to summarize two numbers in a programming language as we would use to reason about the presence of predators  The *rules* that the person believed dictated the behavior of other actors in the world are different. The persons "logical reasoning" is somehow wrong.



Variadic functions and linguistic consistency

In this article I will explore the problem of consistency as it presents itself in programming language systems and their APIs. This article will use both technical concepts from programming, cultural and cognitive linguistic theory. This is heavy. And so I will do my utmost at all turns to explain the concepts in layman terms first, and then use technical and scientific terminology secondarily.

##

Svaner, if a pattern has repeated itself, then it is expected. Og simpelhet. The shortest distance between two points is expected. Efficiency. You expect that Darwin has killed of the least efficient means. You expect only that which is needed to cause an effect, you expect nothing more. Wysiwig. If you can't see it, it isn't there. Elegance. This is tricky. You look for beauty. You look for alive. You look for color. You look for the pattern in the pattern  that can become of use. Break many of these, and it's a "wat" moment.

This is how expectations are formed.

No. The beauty thing. You will attempt to use the pattern differently. I'm curious, can i do this? This will happen from time to time. If your users then will find a way to iterate the loop, they will. If it works, they will see a pattern.

You will look for purity. That is the efficiency. Consistency between plural and singular form. You will look for the function to be usable. That is the advertisement.

Confirmation bias. Test an assumption under the belief that it is true. If a function is superficially correct, then it is deeply correct.

Conceptual consistency. What is true in one semantic domain is also true in another. Syntax over semantics.


Many/most operators are also variadic. The concept of variadic functions quickly lends itself to thinking about the sequence as a list. Compare how kids in School list additions. There is something intuitive about variadic.

But some are not. But they are never == but !==.

If the operators such as +,-,* can be variadic, then variadic functions should behave like +,-,*

Infinity arity is in many concepts. ; and , are infinity arity in sequence. Operators such as plus. Which is the rule, a+b+c or a==b==c?

The variadic antipattern not tripple equals presents you with what appears to be two equal outcomes, but then says that there are difference in side-effects that you cannot see on the surface, but that are still meaningful and can cause bugs if not handled correctly.
This leas to == equals !== confusion. First, if you extract the loop and run the variadic function call style, it appears to work the same way push() does. It appears to give an equal outcome, on the surface, but behind the scenes the two functions are implemented differently so as to produce a different outcome.
The example being the difference callback context and the different MO. The MO are made before the loop, the callbacks at the end.
have a web component that prints the state of the parent element at connectedCallback().
Produce two MO objects.
Then have .append(a) + append(b)  and .append(a,b) and show how they both produce the same dom at the end, but different side effects.
Make the reference to == and !==. Show how people will think that == will mean the same as ===. (edited)

Variadic operators and variadic functions. Also 'duality of form' is a known concept with ; and , as other examples.


What is consistency for library function 1001?

Internal logic. Soundness. No infinite loops. Argument checks. Obvious stuff.
Use case consistency. How will this functions be used. Will the user likely meet his use case. Can it encourage good patterns? Avoid bad patterns? Are there things it should do? Not do? Are there things it cannot do?
Consistency with the other methods. What are the behavior of all the others? See above.

Variadic is a ' ,' operation. You are just listing a,b,c either outside or inside the parenthesis. It is like x=a+b+c is short for x = a+b; x = x+c. You expect x to be the same.

There is no rule that says + and = cannot have side effects. You expect internal consistency.

You expect an iterator not to return an infinite loop. But there is nothing stopping you from making an iterator that "needs break". Adding that semantic rule.

You can actually append the iterator on the function itself. Thus making it even easier for users to extract the loop.

Trust in common helpfulness. If the platform can help me like that, i expect it will.

There will be two camps: one that says side effects are sometimes and one that says side effects not. One that says == would also means ===, and one that says == would nt mean ===, but can mean !==.


Variadic functions also have a reference to natural language linguistics. functions as verbs. And then variadic functions as verbs in plural case, and normal fixed length functions as verbs in singular case.


Variadic structures:
Operatorer som + og - og * og /. Med problemer som == som burde hatt variadisk signatur, men som ikke har det fordi det i begynnelsen var vanskeligere å implementere.
Men vi har også variadiske structures i vanlig språk. "," og ";" i lister er beslektede strukturer. Disse strukturene skaper lister, som kan legge indefinite number og elements to a list, en slags plain engelsk "append()". Denne syntaxen finner vi også i Comma in arrays.
Listestrukturer finnes ikke bare i rom, men også i tid. Punktum i vanlig tekst. Og ";" og "," mellom statements og expressions.

Det er et sentralt poeng at de samme syntaktiske verktøyene ( som oftest comma ) brukes om hverandre for listing i tid og rom. En og samme operasjon som f.eks. append kan like gjerne forstås sekvienselt som spatial: og bruken av "..." Er ment å ta en sekviensell operasjon og gjøre den enda tydeligere illustrere den som spatial.

Variadic functions is first indeterminate/indefinite arity in syntax. Plural arity. 
