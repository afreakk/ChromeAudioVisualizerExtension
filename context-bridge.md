# Context Bridge

Accumulated learnings across task runs. Read this before starting work.

## Discoveries
- When initiateStream() sets state internally, partial failure after it means cleanup in catch should also undo the stream for future hardening
- When moving code out of finally blocks, check whether defensive guards existed specifically because of the finally context
- Consolidating switch/if-else into a registry naturally fixes inconsistencies because all entries flow through the same code path

## Conventions
