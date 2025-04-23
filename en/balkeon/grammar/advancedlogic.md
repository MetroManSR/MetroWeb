---
layout: default
title: "The Complete Balkeon Logic System"
language: en
---

# The Complete Balkeon Logic System

## Table of Contents
1. [Core Principles](#core-principles)
2. [Operator Taxonomy](#operator-taxonomy)
3. [Basic Operations](#basic-operations)
4. [Quantification System](#quantification-system)
5. [Partial Operations](#partial-operations)
6. [Operator Interactions](#operator-interactions)
7. [Semantic Context Rules](#semantic-context-rules)
8. [Practical Applications](#practical-applications)
9. [Anti-Patterns](#anti-patterns)
10. [Reference Tables](#reference-tables)

## Core Principles <a name="core-principles"></a>

Balkeon operates on three axiomatic foundations:

1. **Duality Separation**  
   - `nek` (¬): Truth-functional negation  
     *Example*: `nek P` ⇔ ¬P  
   - `tan` (∼): Semantic inversion  
     *Example*: `tan light` = dark  

2. **Quantification Spectrum**  
   ```
   tut (∀) —— half (½) —— part (∃)
   ```

3. **Compositionality**  
   All operators maintain strict:
   - Idempotency: `op(op X) = X`  
   - Commutativity: `op1 op2 X = op2 op1 X` (except `tan`+`nek`)

## Operator Taxonomy <a name="operator-taxonomy"></a>

<table>
  <thead>
    <tr>
      <th>Type</th>
      <th>Operators</th>
      <th>Arity</th>
      <th>Binding</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Logical</td>
      <td><code>nek</code></td>
      <td>Unary</td>
      <td>Strong</td>
    </tr>
    <tr>
      <td>Semantic</td>
      <td><code>tan</code></td>
      <td>Unary</td>
      <td>Weak</td>
    </tr>
    <tr>
      <td>Quantifier</td>
      <td><code>tut</code>, <code>part</code>, <code>half</code></td>
      <td>Unary</td>
      <td>Medium</td>
    </tr>
    <tr>
      <td>Prefix</td>
      <td><code>par-</code></td>
      <td>Unary</td>
      <td>N/A</td>
    </tr>
  </tbody>
</table>

## Basic Operations <a name="basic-operations"></a>

### Negation (`nek`)
<table>
  <thead>
    <tr>
      <th>P</th>
      <th>nek P</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>T</td>
      <td>F</td>
    </tr>
    <tr>
      <td>F</td>
      <td>T</td>
    </tr>
  </tbody>
</table>

### Opposite (`tan`)
<table>
  <thead>
    <tr>
      <th>Input</th>
      <th>Output</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>up</code></td>
      <td><code>down</code></td>
    </tr>
    <tr>
      <td><code>buy</code></td>
      <td><code>sell</code></td>
    </tr>
  </tbody>
</table>

## Quantification System <a name="quantification-system"></a>

<table>
  <thead>
    <tr>
      <th>Quantifier</th>
      <th>Scope Rules</th>
      <th>Example</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>tut</code></td>
      <td><code>tut (X ∧ Y) ⇔ (tut X) ∧ (tut Y)</code></td>
      <td><code>tutel ucelseon flegir</code></td>
    </tr>
    <tr>
      <td><code>part</code></td>
      <td><code>part (X ∨ Y) ⇔ (part X) ∨ (part Y)</code></td>
      <td><code>partel katseon durmir</code></td>
    </tr>
    <tr>
      <td><code>half</code></td>
      <td><code>half P ≡ 0.5 ≤ P < 0.55</code></td>
      <td><code>half true</code></td>
    </tr>
  </tbody>
</table>

## Partial Operations <a name="partial-operations"></a>

<table>
  <thead>
    <tr>
      <th>Form</th>
      <th>Definition</th>
      <th>Example</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>par-</code> prefix</td>
      <td><code>par-P ⇔ P ∩ ¬tut P</code></td>
      <td><code>partadashidu</code></td>
    </tr>
    <tr>
      <td>Combined forms</td>
      <td><code>par-tan X = partial opposite</code></td>
      <td><code>partansapir</code></td>
    </tr>
  </tbody>
</table>

## Operator Interactions <a name="operator-interactions"></a>

<table>
  <thead>
    <tr>
      <th>Interaction</th>
      <th>Rule</th>
      <th>Example</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>tan + nek</code></td>
      <td><code>tan nek P ≢ nek tan P</code></td>
      <td>
        <code>tannekhasidu = cold</code><br>
        <code>nek tan hot = ¬cold</code>
      </td>
    </tr>
    <tr>
      <td>Quantifiers</td>
      <td><code>half part X ⇔ part half X</code></td>
      <td><code>halfpartel katseon</code></td>
    </tr>
  </tbody>
</table>

## Semantic Context Rules <a name="semantic-context-rules"></a>

<table>
  <thead>
    <tr>
      <th>Rule</th>
      <th>Requirement</th>
      <th>Example</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Domain Restriction</td>
      <td><code>tan</code> requires antonym declaration</td>
      <td>
        <pre>declare_opposites {
  give ⇔ take
  win ⇔ lose
}</pre>
      </td>
    </tr>
    <tr>
      <td>Null Operations</td>
      <td>
        <code>tantan P = P</code><br>
        <code>neknek P = P</code>
      </td>
      <td><code>tantanar = up</code></td>
    </tr>
  </tbody>
</table>

## Reference Tables <a name="reference-tables"></a>

### Operator Precedence
<table>
  <thead>
    <tr>
      <th>Priority</th>
      <th>Operator</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1 (Highest)</td>
      <td><code>par-</code></td>
    </tr>
    <tr>
      <td>2</td>
      <td><code>tan</code></td>
    </tr>
    <tr>
      <td>3</td>
      <td><code>nek</code></td>
    </tr>
    <tr>
      <td>4</td>
      <td><code>half</code></td>
    </tr>
    <tr>
      <td>5 (Lowest)</td>
      <td><code>part</code>/<code>tut</code></td>
    </tr>
  </tbody>
</table>

### Equivalence Laws
<table>
  <thead>
    <tr>
      <th>Balkeon</th>
      <th>Logical Form</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>nektan P</code></td>
      <td>¬(∼P)</td>
    </tr>
    <tr>
      <td><code>halfnek P</code></td>
      <td>0.5(¬P)</td>
    </tr>
    <tr>
      <td><code>partut X</code></td>
      <td>∃x∈X, ¬∀x</td>
    </tr>
  </tbody>
</table>

### Quick Decision Guide
<table>
  <thead>
    <tr>
      <th>Need to express...</th>
      <th>Solution</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Truth reversal</td>
      <td><code>nek</code></td>
    </tr>
    <tr>
      <td>Concept inversion</td>
      <td><code>tan</code></td>
    </tr>
    <tr>
      <td>Quantity:
        <ul>
          <li>All (100%)</li>
          <li>Some (>0%)</li>
          <li>Half (50%)</li>
        </ul>
      </td>
      <td>
        <code>tut</code><br>
        <code>part</code><br>
        <code>half</code>
      </td>
    </tr>
    <tr>
      <td>Partial state</td>
      <td><code>par-</code></td>
    </tr>
  </tbody>
</table>



