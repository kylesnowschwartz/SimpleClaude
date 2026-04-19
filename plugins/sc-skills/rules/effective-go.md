---
paths:
  - "**/*.go"
---

# Effective Go

Apply best practices from the official [Effective Go guide](https://go.dev/doc/effective_go) when writing, reviewing, or refactoring Go code.

## Key Conventions

- **Formatting**: Always use `gofmt` — non-negotiable
- **Naming**: No underscores. `MixedCaps` for exported names, `mixedCaps` for unexported
- **Error handling**: Always check errors. Return them, don't panic
- **Concurrency**: Share memory by communicating — use channels
- **Interfaces**: Keep small (1-3 methods ideal). Accept interfaces, return concrete types
- **Documentation**: Document all exported symbols, starting with the symbol name

## References

- Official Guide: https://go.dev/doc/effective_go
- Code Review Comments: https://github.com/golang/go/wiki/CodeReviewComments
- Standard Library: reference for idiomatic patterns
