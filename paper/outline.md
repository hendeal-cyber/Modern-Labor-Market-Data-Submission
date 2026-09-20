# Paper outline

Structure for the write-up. Sections fill in as data accumulates.

## 1. Introduction
The question: what posting attributes predict advertised pay for early-career
software/data roles in the utility and data center sectors? Why this sector
pairing is interesting — data center buildout is driving utility-adjacent
technical hiring, and both sectors are hiring software/data talent against
competition from pure tech employers.

## 2. Institutional background
Illinois HB 3129 (effective 2025-01-01): pay scale and benefits disclosure
mandated for employers with 15+ employees. Indiana has no such law. This
asymmetry is the study's main source of disclosure variation — and its main
threat to the metro comparison.

## 3. Data
- Source: public ATS APIs, not LinkedIn (see methods; ToS reasoning belongs here)
- Sampling frame: core operators, defined in `config/employers.yaml`
- Screening and the selection funnel (report the actual counts)
- Regressor coding and audited accuracy
- Descriptive statistics

## 4. Empirical strategy
log(pay midpoint) on posting attributes, SEs clustered by employer.
Pre-specified core model; extended model only if N supports it.
State the few-cluster caveat and the wild bootstrap remedy.

## 5. Results
- Core model
- Extended model, if N permits
- Secondary: range width as a measure of employer pay-setting uncertainty
- Secondary: what predicts disclosure at all

## 6. Threats to validity
Advertised vs realized pay. Disclosure selection. Stock-vs-flow composition.
Coding error. Few clusters. Small N.

## 7. Conclusion

## Appendix
Codebook, audit log, full selection funnel, replication instructions.
