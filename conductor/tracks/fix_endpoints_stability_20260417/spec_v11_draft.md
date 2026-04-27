# Specification: API Routing & Frontend Retry Fix - Final v25 (DRAFT)

## 1. Overview
Supreme-Grade Fault-Tolerant Distributed Architecture (v25). Implements Hysteresis-aware Load Shedding, Fencing-Token Coordination, and Checksum-Verified Durability.

## 2. Behavioral Requirements (EARS)

- **[R-001: Checksum-Verified Double-Write Durability]**
  - Simulation results MUST use a **Double-Write Buffer** with high-resolution checksums (e.g., BLAKE3).
  - IF a system failure occurs during a write, the system MUST detect corruption via checksum failure on the next boot and automatically revert to the redundant secondary copy.
  - This provides physical durability without the performance penalty of Direct I/O in virtualized environments.

- **[R-002: Jittered RFC-Compliant Retries]**
  (unchanged)

- **[R-003: Fencing-Token Coordination]**
  - Leader Election MUST issue a globally incrementing **Fencing Token** (persisted in DB/shared-store).
  - ONLY requests accompanied by the *latest* token are accepted by the backend.
  - This ensures that a "Zombie Leader" (Split-brain) cannot corrupt the global state if their heartbeat was delayed by JS thread blocking.

- **[R-004: Schema Integrity]**
  (unchanged)

- **[R-005: Response Verification]**
  (unchanged)

- **[R-006: Server-Delta Sync]**
  (unchanged)

- **[R-007: Hysteresis-Aware Concurrency Shedding]**
  - **SHUTDOWN THRESHOLD**: If `RTT_ewma >= 30s`, slots = **ZERO**.
  - **RECOVERY THRESHOLD**: Slots MUST remain ZERO until `RTT_ewma` drops below **20s** (The Hysteresis Buffer).
  - This prevents **System Flapping** and ensure the backend has clear air to stabilize before resuming load.

- **[R-008: Graceful Degradation]**
  (unchanged)

- **[R-009: Tokenized Linearizability]**
  (unchanged)

- **[R-010: Registry Pair Hygiene]**
  (unchanged)

- **[R-011: Emergent Atomic Reclamation]**
  (unchanged)

## 3. Hostile Invariants (Mandated)

- **[I-HYSTERESIS-STABILITY]**: Prove the system does not enter a high-frequency ON/OFF loop when RTT oscillates between 28s and 32s.
- **[I-FENCING-VALIDATION]**: Simulate two active leaders (Tab A with Token N, Tab B with Token N+1); verify the backend rejects Tab A's request immediately.
- **[I-CHECKSUM-RECOVERY]**: Inject bit-flips into a result file; prove the system detects and recovers the valid state from the double-write buffer.

## 4. Success Criteria
1. ZERO flapping detected under RTT oscillation.
2. Verified Split-brain immunity via Fencing.
3. **PASS** verdict from adversarial review.
