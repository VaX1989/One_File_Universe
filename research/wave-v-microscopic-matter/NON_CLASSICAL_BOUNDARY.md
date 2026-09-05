# WV-E Non-Classical Research Boundary

## Scope

WV-E does **not** implement a quantum universe, quantum dynamics, electronic structure, wavefunctions or canonical quantum identity. This document only defines a future handoff boundary so the classical microscopic architecture does not make claims it cannot support.

## Why a separate ModelRegime is required

Electronic/quantum models can have state variables and observables that are not equivalent to a hierarchy of smaller classical objects. QM/MM practice itself treats the quantum region, classical environment, embedding, boundary and sampling protocol as explicit modeling choices. Therefore a future non-classical regime must be method-specific, versioned and validated; it cannot be implied by magnification.

## Classical information that may cross into a future method

Only when explicitly supported by a method contract:

- nuclear species / element identities;
- a defined molecular topology or composition;
- nuclear geometry with units and uncertainty;
- classical charges/embedding assumptions if required by the method;
- thermodynamic/environment boundary conditions;
- external fields;
- explicitly chosen electronic charge/spin/state hypothesis;
- region selection and link/boundary treatment for hybrid methods.

These are **inputs to a model**, not a derivation of the quantum state.

## Possible future outputs

Method-specific outputs may include, with full provenance and uncertainty:

- energy differences;
- forces on nuclei;
- optimized geometries;
- free-energy estimates;
- charge/spin-density summaries;
- spectra or transition observables;
- reaction barriers/mechanistic alternatives.

The output contract must name the Hamiltonian/level of theory, basis/pseudopotential where relevant, embedding, boundary conditions, convergence criteria, sampling and numerical implementation evidence needed for reproducibility.

## Claims prohibited by geometry alone

From classical positions/topology alone WV-E must not claim:

- a unique wavefunction/electronic state;
- a unique reaction pathway;
- entanglement structure;
- measurement outcomes;
- exact electron trajectories;
- universal permanent identities for indistinguishable quantum particles;
- a history of quantum events.

## Visualization boundary

Electron clouds/orbitals/densities may eventually be visualized only when they are outputs of an explicitly named method or are labeled pedagogical/metaphorical. Decorative “probability clouds” generated from atom type alone have no scientific dynamical authority.

## Promotion gate for any future non-classical adapter

A future lane must independently specify scientific question, context of use, state variables, observables, bridge semantics, numerical method, reproducibility inputs, validation benchmarks, uncertainty, computational bounds and authority. WV-E intentionally leaves this gate closed.
