#!/usr/bin/env node
// aiscrum: POC minimalista del patrón "Beads" — grafo de tareas git-backed para agentes.
// Sin dependencias externas. Estado = un JSONL versionado en git, no un servidor central.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";

const DB_DIR = ".aiscrum";
const DB_FILE = path.join(DB_DIR, "issues.jsonl");

function load() {
  if (!existsSync(DB_FILE)) return [];
  return readFileSync(DB_FILE, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

function save(issues) {
  issues.sort((a, b) => a.id.localeCompare(b.id));
  writeFileSync(DB_FILE, issues.map((i) => JSON.stringify(i)).join("\n") + "\n");
}

function newId() {
  return "ai-" + randomBytes(4).toString("hex"); // hash-based, evita colisiones en merges multi-agente
}

function findOrDie(issues, id) {
  const it = issues.find((i) => i.id === id);
  if (!it) {
    console.error(JSON.stringify({ error: `issue ${id} no existe` }));
    process.exit(1);
  }
  return it;
}

function isReady(issues, issue) {
  if (issue.status !== "open") return false;
  return issue.deps.every((depId) => {
    const dep = issues.find((i) => i.id === depId);
    return dep && dep.status === "done";
  });
}

const [, , cmd, ...args] = process.argv;

function flag(name, def = null) {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? def : args[i + 1];
}

if (!existsSync(DB_DIR)) mkdirSync(DB_DIR);

switch (cmd) {
  case "add": {
    const title = args[0];
    if (!title) {
      console.error("uso: aiscrum add \"titulo\" [--type task|bug|message] [--deps id1,id2] [--assignee agent:x]");
      process.exit(1);
    }
    const issues = load();
    const depsArg = flag("deps");
    const issue = {
      id: newId(),
      title,
      type: flag("type", "task"),
      status: "open",
      deps: depsArg ? depsArg.split(",") : [],
      links: { relates_to: [], duplicates: [], supersedes: [], replies_to: [] },
      assignee: flag("assignee", null),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      closed_at: null,
      evidence: [],
    };
    issues.push(issue);
    save(issues);
    console.log(JSON.stringify(issue, null, 2));
    break;
  }

  case "ready": {
    const issues = load();
    const readyIssues = issues.filter((i) => isReady(issues, i));
    console.log(JSON.stringify(readyIssues, null, 2));
    break;
  }

  case "list": {
    const issues = load();
    console.log(JSON.stringify(issues, null, 2));
    break;
  }

  case "show": {
    const issues = load();
    const issue = findOrDie(issues, args[0]);
    console.log(JSON.stringify(issue, null, 2));
    break;
  }

  case "done": {
    const issues = load();
    const issue = findOrDie(issues, args[0]);
    const evidence = flag("evidence"); // ej: URL de PR, id de test run, trace id — no "Done" booleano pelado
    issue.status = "done";
    issue.updated_at = new Date().toISOString();
    issue.closed_at = issue.updated_at;
    if (evidence) issue.evidence.push(evidence);
    save(issues);
    console.log(JSON.stringify(issue, null, 2));
    break;
  }

  case "block": {
    // aiscrum block <id> --on <otroId>   => <id> queda bloqueado por <otroId>
    const issues = load();
    const issue = findOrDie(issues, args[0]);
    const onId = flag("on");
    findOrDie(issues, onId);
    if (!issue.deps.includes(onId)) issue.deps.push(onId);
    issue.updated_at = new Date().toISOString();
    save(issues);
    console.log(JSON.stringify(issue, null, 2));
    break;
  }

  case "link": {
    // aiscrum link <id> --relates_to <otroId>
    const issues = load();
    const issue = findOrDie(issues, args[0]);
    for (const kind of ["relates_to", "duplicates", "supersedes", "replies_to"]) {
      const target = flag(kind);
      if (target) {
        findOrDie(issues, target);
        issue.links[kind].push(target);
      }
    }
    issue.updated_at = new Date().toISOString();
    save(issues);
    console.log(JSON.stringify(issue, null, 2));
    break;
  }

  default:
    console.log(`aiscrum <comando>

  add "titulo" [--type task|bug|message] [--deps id1,id2] [--assignee agent:x]
  ready                          lista lo que se puede hacer AHORA (sin bloqueadores abiertos)
  list                           lista todo el grafo
  show <id>
  done <id> [--evidence texto]   cierra y adjunta evidencia (no un booleano pelado)
  block <id> --on <otroId>       agrega dependencia
  link <id> --relates_to <otroId> [--duplicates] [--supersedes] [--replies_to]

Estado real: .aiscrum/issues.jsonl — versionado en git. No hay servidor.`);
}
