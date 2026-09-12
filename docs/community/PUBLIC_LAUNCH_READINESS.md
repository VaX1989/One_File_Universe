# OFU 2.0 Public Launch Readiness

OFU 2.0 is intended to be both a product release and the public birth of a scalable Open Source development community. Launch readiness is therefore broader than feature completeness.

The authoritative machine-readable gate set is `config/governance/public-launch-gates.json`. A blocking gate is not satisfied by enthusiasm, a stale branch certificate, or a document that says the right thing. It needs evidence appropriate to the claim.

## The launch test

A technically capable person who has never spoken with the founder should be able to:

1. understand the project's thesis in minutes;
2. build/open the universe without hidden infrastructure;
3. see what is real today and what remains an ambition;
4. inspect scientific/model authority rather than infer truth from visuals;
5. find a contribution area and its risk/owners;
6. run the relevant local validation path;
7. understand the GPL and contribution-rights model without a legal surprise.

## Promotion rule

`npm run launch:readiness` reports the ledger. `npm run launch:readiness -- --require-ready` is intentionally fail-closed and must not pass until every blocking gate is recorded as `PASS` with evidence.

A public campaign may disclose known limitations. It may not silently relabel missing evidence as success.
