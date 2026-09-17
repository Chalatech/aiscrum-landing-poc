# aiscrum-landing-poc

Landing page de demostración construida **siguiendo el patrón "aiscrum" (grafo
de tareas git-backed, estilo Beads/Steve Yegge)** en vez de un tablero Jira.

No es solo una landing con un README que lo explica: el `git log` de este
repo *es* la traza de cómo se construyó, tarea por tarea, con dependencias
que bloqueaban el trabajo hasta cerrarse con evidencia.

## El grafo real de este repo

```
Estructura HTML base
   ├─▶ Estilos y responsive (CSS)      ┐
   └─▶ Formulario + validación JS      ┴─▶ Revisión copy/accesibilidad ─▶ Deploy
```

Reconstruilo vos mismo:

```bash
node bin/aiscrum.mjs list     # todo el grafo, con evidencia de cada cierre
node bin/aiscrum.mjs ready    # qué queda por hacer ahora (nada — todo cerrado)
git log --oneline             # cada commit de código va seguido de su commit "aiscrum: done ..."
```

## Qué demuestra esto

- **Git como base de datos del trabajo**: el estado vive en
  `.aiscrum/issues.jsonl`, versionado junto al código. `git revert` de un
  commit `done` revierte también el estado de la tarea (ver el POC hermano
  en `Documents/ANIA/aiscrum-poc` para esa prueba explícita).
- **`ready` computado, no columnas**: la tarea de revisión no aparecía en
  `ready` hasta que *ambas* — CSS y JS — quedaron `done`.
- **Evidencia, no un booleano**: cada `done` lleva el hash de commit o la
  nota de revisión que lo respalda.

## Correr la landing localmente

```bash
python3 -m http.server 8080
# abrir http://localhost:8080
```

## Deploy

GitHub Pages sirve directamente `index.html` desde la raíz de `main`
(ver Settings → Pages en el repo).
