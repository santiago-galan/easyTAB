# PhoenixTAB

Local-first moot court tabulation system built to AMCA and NAMC standards.
All tournament data stays on your machine. No internet connection, no account, no cloud sync.

---

## Getting Started

### Download

1. Go to the [**Releases**](../../releases/latest) page
2. Download **PhoenixTAB-Setup-x.x.x.exe**
3. Run the installer and launch the app

### First Tournament

1. **Create a tournament** from the sidebar dropdown
2. **Register teams** (Module 01) manually or via CSV import
3. **Set up courtrooms and generate pairings** (Module 02)
4. **Enter ballot scores** (Module 03) as rounds complete
5. **View live standings and oralist rankings** (Module 04)

---

## Modules

### 01 — Team Ingestion

Register participating teams with school name, two oralist names, and a contact email.

- **Manual entry** with real-time validation (required fields, unique oralist names, valid email)
- **Bulk CSV import** — expected columns: `School_Name`, `Orator_1`, `Orator_2`, `Contact_Email` (headers are case-insensitive; team IDs are auto-assigned)
- **Export** the master team list as `master_teams.csv` at any time
- Sort and filter teams by ID, school, or oralist name

### 02 — Pairing Engine

Generate round-by-round matchups with configurable constraints.

- **Random pairing** (Round 1, or all rounds if Swiss is off): shuffled assignment with backtracking to satisfy constraints
- **Swiss (power) pairing** (Rounds 2+ when enabled): ranks teams by ballot wins and strength of schedule, then pairs adjacent-ranked teams
- **Hard constraint**: no intra-school matchups
- **Soft constraint**: no repeat matchups (flagged with an amber badge when unavoidable)
- **Side balance**: petitioner/respondent assignment drawn from full round history to minimize imbalance
- Lock rounds to finalize pairings before entering results
- Unresolved conflicts (e.g., an odd number of teams from the same school) surface in a conflict panel for manual resolution
- Export each round's pairings as CSV

**Tournament settings** (configured in Setup tab):

| Setting | Description |
|---|---|
| Preliminary Rounds | Number of rounds before elimination (1-10) |
| Swiss Pairing | Toggle power pairing for Rounds 2+ |
| Ballot Standard | AMCA or NAMC (determines scoring criteria in Module 03) |

### 03 — Results Manager

Enter judge scores per courtroom using the ballot standard selected for the tournament.

- Click any courtroom row to open the ballot entry modal
- Set judge count per courtroom (1-9); enter scores for each judge on separate tabs
- Each judge scores **both oralists** on each team across all criteria
- Scores are validated to be whole numbers within the allowed range

**AMCA ballot criteria** (per oralist):

| Criterion | Range |
|---|---|
| Knowledge of Subject Matter | 0 - 100 |
| Response to Questions | 0 - 100 |
| Forensic Skill & Courtroom Demeanor | 0 - 100 |
| Organization, Logic & Clarity of Argument | 0 - 100 |

**NAMC ballot criteria** (per oralist):

| Criterion | Range |
|---|---|
| Content of Argument | 0 - 20 |
| Extemporaneous Ability | 0 - 20 |
| Forensic Skill & Courtroom Demeanor | 0 - 10 |

**Score flagging**: any criterion score below 50% of its maximum is highlighted in red as a warning.

**Tie handling**: when a judge's ballot totals are equal for both teams, the ballot is flagged as tied and awards 0.5 ballots to each team.

### 04 — Tabulator

Computes live team standings and oralist award rankings from entered results.

**Ballot normalization**: every courtroom contributes exactly 2 ballots, regardless of judge count. If a courtroom has 3 judges and the petitioner won 2 of 3 ballots, they receive `(2/3) x 2 = 1.333` normalized ballots.

**Team ranking criteria** (applied in tiebreaker order):

1. **Ballot wins** (normalized)
2. **Strength of Schedule** (average opponent ballot-win rate)
3. **Point differential** (raw score sum difference across all judges and rounds)

Teams sharing identical values across all three criteria receive the same seed.

**Oralist rankings**: sorted by average score across all judge appearances, with ties broken by total appearances.

Both tables can be exported as CSV.

---

## Data & Privacy

PhoenixTAB stores all data in your browser's LocalStorage (namespaced per tournament). Nothing is sent over the network. Deleting a tournament removes all associated data permanently.

---

## For Developers

**Requirements:** [Node.js](https://nodejs.org/) v18+

```bash
npm install
npm run electron:dev
```

### Build

Portable `.exe` (no installer):

```bash
npm run dist
```

NSIS installer (used by CI):

```bash
npm run dist:installer
```

### Releasing

1. Bump `version` in `package.json`
2. Commit and push
3. Tag and push:

```bash
git tag v1.0.1
git push origin v1.0.1
```

GitHub Actions builds the installer and attaches it to a new Release automatically.

### Architecture

```
src/
  types/          Shared TypeScript interfaces
  lib/            Core utilities (storage, CSV, theme, ballot config)
  context/        React context providers (tournament, theme)
  components/     Layout shell and sidebar
  modules/
    teams/        Module 01 — Team ingestion & validation
    pairings/     Module 02 — Pairing engine & side balance
    results/      Module 03 — Ballot entry & score calculation
    tabulator/    Module 04 — Standings & oralist rankings
electron/         Electron main process & preload
```

All modules communicate through LocalStorage with tournament-namespaced keys. CSV import/export uses PapaParse. The pairing engine uses a backtracking algorithm with MRV heuristic for constraint satisfaction.
