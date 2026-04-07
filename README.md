# PhoenixTAB

Local-first moot court tabulation system built to AMCA/NAMC standards.  
All data is stored on your machine. No internet connection required after installation.

---

## Download & Install

1. Go to the [**Releases**](../../releases/latest) page of this repository
2. Download **PhoenixTAB-Setup-x.x.x.exe**
3. Run the installer — no account, no internet, no configuration needed

---

## For developers

**Requirements:** [Node.js](https://nodejs.org/) v18 or later

```
npm install
npm run electron:dev
```

To build a portable distribution locally:

```
npm run dist
```

To produce a full NSIS installer (requires GitHub Actions or Windows with Developer Mode enabled):

```
npm run dist:installer
```

### Releasing a new version

1. Update the version in `package.json`
2. Commit and push
3. Create and push a version tag:

```
git tag v1.0.1
git push origin v1.0.1
```

GitHub Actions will automatically build the installer and attach it to a new Release.

---

## Module status

| # | Module | Status |
|---|---|---|
| 01 | Team Ingestion | Complete |
| 02 | Pairing Engine | Complete |
| 03 | Results Manager | Complete |
| 04 | Tabulator | Complete |
