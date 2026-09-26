# 50-feature rollout
This is an implementation checklist, not a claim of production readiness.
Status: TODO = not end-to-end verified; FOUNDATION = code introduced, see verification report.

## Identity and users
1. Database-backed email login — TODO
2. Secure session verification and expiry — TODO
3. Server logout and client identity refresh — TODO
4. Admin-only user directory — TODO
5. Paginated user search — TODO
6. User creation with validated passwords — TODO
7. Tenant-scoped role changes — TODO
8. User deactivation/reactivation — TODO
9. Last-administrator protection — TODO
10. Verified Google-to-server session exchange — TODO
## AI Chat and memory
11. Buffered SSE decoding across network chunks — TODO
12. HTTP/provider error messages and retry — TODO
13. Cancellation without stale response updates — TODO
14. User-owned conversation creation — TODO
15. Paginated conversation listing — TODO
16. Conversation history loading — TODO
17. Persistent conversation renaming — TODO
18. Persistent pin/unpin — TODO
19. Persistent archive/restore — TODO
20. Transactional conversation deletion — TODO
21. Server-side message feedback — TODO
22. Persistent message bookmarks — TODO
23. Conversation export — TODO
24. Safe AI-response HTML rendering — TODO
25. Search-to-chat prompt handoff — TODO
## Documents and retrieval
26. Tenant-scoped document directory — TODO
27. Validated multipart uploads — TODO
28. Durable object storage and real downloads — TODO
29. Queued indexing with progress — TODO
30. Failed indexing retry — TODO
31. Server-side document filtering and sorting — TODO
32. Permission-checked bulk deletion — TODO
33. Document version history — TODO
34. Persistent document favorites — TODO
35. Real full-text search — TODO
36. Vector/hybrid retrieval over uploaded content — TODO
37. Source citations backed by retrieved chunks — TODO
## Operations and settings
38. Database-backed dashboard counts — TODO
39. Real analytics date-range aggregation — TODO
40. Persistent agent configuration — TODO
41. Evaluation jobs with real scores — TODO
42. Trace filtering and export — TODO
43. User-scoped settings save/reset — TODO
44. Profile editing — TODO
45. Read/unread notifications — TODO
46. Audited administrative changes — TODO
## Capacity and delivery
47. Bounded connection pool and query timeouts — TODO
48. Safe, batched synthetic bulk-data generator — TODO
49. Pagination indexes and reviewed migration — TODO
50. Browser regression and concurrent-user load tests — TODO
## Audit findings
- 14 page routes exist. Most dashboards and charts import mock data.
- Admin Create User is an alert; role/status controls are not persisted.
- Memory pin/archive/delete handlers only stop event propagation.
- Settings Save waits on a timer and does not persist preferences.
- Chat drops split SSE frames and appends metadata as `undefined`.
- Required string IDs lack defaults; the baseline typecheck fails in seed.ts.
- Conversations and user routes lack ownership/authorization checks.
- Auth context only follows Firebase, while email login creates a separate cookie.
- A live PostgreSQL URL is configured. Do not bulk-seed it until its environment,
  backups, capacity, and intended synthetic-data volume are confirmed.

## Release gates
Every feature needs positive, negative, authorization, reload/persistence, and
failure-path tests where applicable. Rendering a page does not verify its buttons.
Do not expose this application publicly while tenant/document isolation and the
remaining security controls are unverified. Never treat mock counters as capacity.
