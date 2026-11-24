# docs/ai

Contexto de sesiones largas, exportado a Markdown para que sobreviva a la compactación.

## Archivos

| Archivo | Qué es |
|---|---|
| `session-export.md` | Export completo de la sesión original de migración a Yeap Cloud. 2.645 mensajes, 200 turnos, los 23 resúmenes de compactación. Texto de usuario y asistente sin recortar; herramientas resumidas a una línea. |

## Para qué sirve

Cuando una sesión supera varias compactaciones, el modelo pierde el hilo y empieza a responder como consultor en vez de operar. Este export conserva la conversación real.

## Cómo usarlo

En una sesión nueva, con el repo como directorio de trabajo:

```
Lee HANDOFF.md y después docs/ai/session-export.md.

Es el historial de la migración a Yeap Cloud. Después de leerlo:
1. Confirma en 10 líneas el estado real.
2. Corre git status y git diff --stat.
3. Sigue con el próximo paso de HANDOFF.md.

No repitas trabajo hecho. No pidas credenciales en el chat.
```

## Regenerarlo

El export se genera desde la base de LarpCode:

```
%APPDATA%\ai.larpcode.desktop\xdg\data\opencode\opencode.db
```

1. Copia `opencode.db`, `opencode.db-wal` y `opencode.db-shm` a una carpeta temporal. No abras la base original.
2. Abre la copia en solo lectura con `node:sqlite` (`new DatabaseSync(path, { readOnly: true })`).
3. Tablas: `session_v2` (metadatos) y `session_message` (`type`, `seq`, `data` JSON).
4. Filtra por `session_id`, ordena por `seq`.
5. Tipos: `user`, `assistant`, `system`, `idle`, `location-switched`, `compaction`, `model-switched`, `agent-switched`, `synthetic`.
6. En `assistant`, `data.content` es un array de partes `text`, `reasoning` y `tool`.

Session ID original: `ses_eaf08c52bffeHu0u44Clqn0baV`.

## Nota

No commitear exports que contengan credenciales, tokens o datos personales. El actual está limpio: las credenciales nunca se pegaron en el chat.
