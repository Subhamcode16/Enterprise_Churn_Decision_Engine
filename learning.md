# VALENCE Project Knowledge & Design Memory

## 1. Anti-Badge Clutter Mandate (Core Design Memory)
- **Principle**: NEVER plaster generic AI metadata capsules or decorative badge chips onto every component or section header.
- **Rule**: Badges are strictly reserved for **critical high-signal operational indicators** (e.g. Critical/High churn risk thresholds and Live vs. Sandbox workspace connection status).
- **Alternative**: Rely on refined typographic hierarchy (font size contrast, serif/sans pairing, generous negative space, and delicate hairline dividers).

## 2. Layout & Breathing Room
- Provide generous vertical spacing (`space-y-8 lg:space-y-10`) between header navigation ribbons and primary KPI metric bento grids.
- Ensure supporting reference sections (such as Knowledge Base & FAQ) sit directly on the seamless canvas page rather than inside nested card containers, ensuring natural scroll rhythm.

## 3. Machine Learning & Telemetry Ingestion
- **TreeSHAP Attributions**: Compute game-theoretic Shapley feature attributions with sub-50ms latency using tree path explainers.
- **Tenant Vault Isolation**: Partition customer telemetry with AES-256 GCM encryption at rest.
