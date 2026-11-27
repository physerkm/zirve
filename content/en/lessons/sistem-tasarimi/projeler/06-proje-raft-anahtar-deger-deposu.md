---
title: "Project 5: A Key–Value Store Replicated with Raft"
summary: The summit of distributed systems. Write Raft from scratch, with leader election, log replication, persistence and snapshots. Build a linearizable key–value store on top of it and test its correctness under network partitions, delays and crashes.
---

This is the hardest and most rewarding project in the module. Reading the Raft paper takes an afternoon; writing a Raft that works correctly takes weeks. The gap between the two is the real difficulty of distributed systems: every line of code looks right, but a message ordering that happens once in a million breaks everything.

Someone who finishes this project truly understands how the replication layers of etcd, Consul, CockroachDB, TiKV, Kafka KRaft, and MongoDB work, and can answer the interview question "how does leader election work?" with a depth an ordinary candidate can't match.

## Preparation

1. Read the [extended version of the Raft paper](https://raft.github.io/raft.pdf), especially **Figure 2**. Figure 2 is an almost complete specification of Raft; follow every rule exactly when you write your code. Every place where you think "this rule seems unnecessary" is a bug you'll find later.
2. Watch the algorithm with the [Raft visualization](https://raft.github.io/) and [The Secret Lives of Data](https://thesecretlivesofdata.com/raft/).
3. Review the [Consistency, Consensus, and Distributed Transactions](/tracks/sistem-tasarimi/tutarlilik-uzlasma-ve-dagitik-islemler) lesson.

## Two paths

**A. The MIT 6.5840 labs (recommended).** Lab 3 (Raft) and Lab 4 (KV on top of Raft) on the [course site](https://pdos.csail.mit.edu/6.824/) are written in Go and come with automated tests that exercise hundreds of scenarios (partitions, unreliable networks, crashes, restarts). The quality of the tests is unmatched; they answer the question "did I write this correctly?", which is the biggest thing missing when you work alone.

**B. In your own language, with your own test harness.** If you want to write it in C# or TypeScript, follow the stages below. The real work is building a **simulation harness** in which you control the network and time: nodes talk over a simulated network instead of a real one, and that network can delay, drop, duplicate, and reorder messages and partition nodes.

## Stage 1: leader election

Each node keeps: `currentTerm`, `votedFor`, `log[]`, and a role (follower/candidate/leader).

- If a follower receives no heartbeat from the leader for a **randomized** election timeout (e.g., 150–300 ms), it becomes a candidate: it increments its term, votes for itself, and sends `RequestVote` to the others.
- A node votes for **at most one** candidate per term, and only if the candidate's log is **at least as up to date** as its own (the term of the last entry is greater, or it is equal and the log length is greater than or equal).
- The candidate that gets votes from a majority becomes leader and immediately sends heartbeats (empty `AppendEntries`).
- Any node that sees a message with a higher term updates its term and reverts to follower.

**Tests:**

- Start 3 nodes: is a single leader elected?
- Disconnect the leader from the network: do the rest elect a new leader? When the old leader comes back, does it revert to follower?
- Disconnect the majority: no leader should be elected (a minority can't elect a leader).
- Write an invariant that checks at every step that there are never **two leaders** in the same term.

## Stage 2: log replication

- A client command arrives at the leader; the leader appends the entry to its log as `(term, command)` and sends it to the followers with `AppendEntries`.
- Each `AppendEntries` carries the index and term of the previous entry; the follower rejects it if that entry isn't in its own log. The leader then decrements `nextIndex` for that follower and retries; this way, diverged logs are **forcibly** brought in line with the leader's.
- An entry is committed once it has been replicated to a majority, as long as it is **from the leader's own term**. Entries left over from an earlier term are only committed indirectly (the Figure 8 subtlety in the paper: skipping it is the most famous Raft bug).
- Committed entries are applied to the **state machine** in order.

**Tests:**

- 1,000 commands under normal conditions: is the sequence of applied commands the same on every node?
- Disconnect a follower, send 100 commands, reconnect it: does it catch up?
- Disconnect the leader mid-command, let a new leader be elected, reconnect the old leader: are the old leader's uncommitted entries deleted and replaced with the new ones?
- **Unreliable network:** drop 10% of messages, delay 10%, shuffle their order. Invariant: a committed entry never changes on any node.

## Stage 3: persistence

`currentTerm`, `votedFor`, and `log[]` must be written to disk on every change, **before sending a reply**. Why? If a node votes, crashes, restarts, and forgets its vote, it can vote for a second candidate in the same term: two leaders.

**Test:** crash nodes at random moments and restart them (with their on-disk state). All invariants must keep holding.

## Stage 4: snapshots

The log can't grow forever. The state machine takes a snapshot at regular intervals, and the entries up to that point are deleted. For a follower that has fallen far behind (or has just joined), the leader sends the snapshot with `InstallSnapshot`. Index calculations are now done not from the start of the log but from where the snapshot ends; most bugs come from here.

## Stage 5: the key–value service

Build a service on top of Raft that offers `Get`, `Put`, and `Append`:

- A client request goes to the leader; if a node isn't the leader, it redirects the client to the leader.
- Every operation enters the Raft log and is applied once committed. **Reads too** go through the log (or, before reading, the leader confirms it is still the leader with a round of heartbeats to a majority: *read index*). Otherwise a stale leader cut off by a partition could return stale data and break linearizability.
- **Exactly-once semantics:** the client adds `(clientId, seq)` to every request; the service stores the last applied `seq` per client in the state machine. An `Append` resent after a timeout is not applied twice.

## Stage 6: check linearizability

At the end of the test, record the history of all client operations (start time, end time, input, output) and run it through a **linearizability checker**: [Porcupine](https://github.com/anishathalye/porcupine) (Go, used by the MIT labs) or Jepsen's [Knossos/Elle](https://github.com/jepsen-io/elle) tools. The checker tells you whether the history has an ordering that could have happened on a single-copy system. Under delays, partitions, and crashes, this check must pass **hundreds of times**.

## Debugging tips

- Structured logs for each node: `[t=1234ms] [S2] [term 5] [Leader] AppendEntries -> S3 prevIndex=41 entries=3`. You find bugs by reconstructing a timeline from the logs.
- Run the tests not once but **in a loop** (e.g., 500 times); distributed bugs show up rarely. Make the simulation deterministic so you can reproduce a failed run from its seed value.
- Don't make network calls while holding locks, and don't hold locks while waiting on a channel; most deadlocks come from here.

## Bonus tasks

- **Membership changes:** add/remove nodes while the cluster is running (the single-server change method).
- **Sharded store:** split key ranges across multiple Raft groups and move ranges between groups (MIT Lab 5; the subject of PingCAP TinyKV).
- **Performance:** increase throughput with batching and pipelining; plot a latency–throughput graph.
- Instead of Raft, try **Gossip Glomers' Kafka-Style Log** puzzle, or test the same service with Maelstrom's `lin-kv` workload.

## Completion criteria

- [ ] Tests for leader election, replication, persistence, and snapshots; 500 consecutive successful runs on an unreliable network.
- [ ] A KV service that passes the linearizability checker.
- [ ] The story of the hardest bug you found: symptom, cause, fix. (Your answer to the interview question "tell me about your hardest debugging experience".)
