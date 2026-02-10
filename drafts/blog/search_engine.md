---
title: "search engine logs 01"
description: ""
pubDate: "Jan 24 2026"
updatedDate: "Jan 24 2026"
heroImage: "./stateofmind.png"
---

Before starting this blog i wanna say something:
*I am in pursuit of finding myself, expressing myself through these blogs is one way i found on the internet*

so this project came to my mind when i was scrolling through [rustjobs.com](https://rustjobs.com). I saw this job posting from an european company, the name of the company was not mentioned, maybe it was a stealth startup.
So the role was Senior / Staff Search Infrastructure Engineer (Rust). The requirements listed knowledge of search systems, you know what i am just gonna copy paste everything here:

- Search & retrieval infrastructure Design and build indexing and query-serving systems optimized for low latency, freshness, and scale.
- Ranking, relevance & grounding Develop ranking and reranking pipelines, deduplication, quality signals, and provenance / citation mechanisms.
- Requirements Strong production Rust experience Hands-on experience building search / information retrieval systems Solid understanding of indexing, retrieval, ranking, and relevance trade-offs Comfortable owning systems end-to-end in a startup environment
- Relevant experience / technologies Search & IR: lexical search (e.g. BM25), hybrid retrieval, vector / ANN search (e.g. HNSW)
- Indexing & data pipelines: ingestion, canonicalization, chunking, incremental indexing, deduplication ML-adjacent: embeddings, rerankers, offline relevance evaluation Nice to have: knowledge graphs (entity linking, graph storage), crawler adjacency, quality / anti-spam signals Why this role Build core search infrastructure from an early stage High ownership and architectural influence Direct impact on how AI systems discover and ground information


alright so now we are making a project that is a search engine written from scratch in rust

**Core system**

- Document ingestion
    - HTML / markdown / PDF → text
    - Canonicalization + chunking

- Indexes
    - Lexical: BM25
    - Vector: embeddings + HNSW
-Query engine
    - Hybrid retrieval (BM25 ∪ ANN)
    - Fast top-K merge

- Ranking
    - Score fusion (BM25 + cosine)

    - Simple reranker (hand-crafted signals)

- Grounding
    - Return citations (doc id + chunk offset)
    - Dedup near-identical chunks

- Freshness
    - Incremental indexing (append-only + merge)


```text
Note:

I was going to make a vector database anyway so this had some ideas similar to that that's one of the reason i am taking up this project
```
