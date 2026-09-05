# WV-A Research Errata

The initial state-of-art report text stated that the independent oracle recovered `90.7156%` of the GAMA-shape stellar mass between log10(M/Msun)=9.6 and 11.6. The actually executed independent Python oracle for the checked r0 integration range `[7.0,12.5]` returns:

```text
0.908181493869172 = 90.8181493869172%
```

`distribution-reference-v0.json` is the authoritative measured research-oracle value for this branch. This numerical correction does not change the architecture or promotion-readiness verdict.
