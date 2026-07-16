[Phase 0: 0-30m]   Dev 1 generates skeleton & pushes to main ──► Everyone clones repo
                                                                        │
[Phase 1: 30-150m] ├── Dev 1 (You) codes on: feat/db-and-ai ────────────┤ (Parallel Build)
                   ├── Dev 2 codes on:       feat/backend-core ─────────┤ (No touching each
                   └── Dev 3 codes on:       feat/frontend-ui ──────────┤  other's folders!)
                                                                        │
[Phase 2: 150-200m] Step 1: Dev 1 merges feat/db-and-ai ──► main        │ (Sequential Merge)
                    Step 2: Dev 2 pulls main ──► merges feat/backend-core ──► main
                    Step 3: Dev 3 pulls main ──► connects Axios ──► merges feat/frontend-ui ──► main
                                                                        │
[Phase 3: 200-240m] Everyone pulls main ──► Live QA & Bug Fixing on Cloud URL