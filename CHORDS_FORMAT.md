# Formato JSON degli accordi

Una **lista** di accordi è un unico file JSON con questa forma:

```json
{
  "id": "id-stabile-della-lista",
  "name": "Nome della lista",
  "chords": [ /* array di accordi, vedi sotto */ ]
}
```

- `id`: stringa stabile che identifica la lista. Se manca, il file viene
  importato come lista **nuova** (mai come aggiornamento di una esistente).
- Ri-esportando una lista dall'app ottieni sempre questo stesso formato,
  con tutti gli id, così puoi ri-modificarla mantenendo l'identità degli
  accordi.

## Un accordo

```json
{
  "id": "id-stabile-dell-accordo",
  "name": "C",
  "variant": "open",
  "strings": ["x", 3, 2, 0, 1, 0],
  "fingers": [null, 3, 2, null, 1, null],
  "barres": []
}
```

- `id`: stabile, indipendente da nome/variante/forma. Usato per capire, in un
  import, se un accordo va **aggiornato** (id già noto) o **aggiunto** (id
  nuovo o assente).
- `name`: obbligatorio (es. `"C"`).
- `variant`: etichetta opzionale per distinguere varianti dello stesso nome
  (es. `"open"`, `"barre E-shape"`). Le varianti sono semplicemente altri
  accordi con lo stesso `name` e `id` diverso.
- `strings`, `fingers`, `barres`: tutti opzionali. Se `strings` manca,
  l'accordo è "solo nome": non viene disegnato nessun diagramma.

### `strings` — convenzione a INDICE (0..5 = corda 6..1)

Array di 6 posizioni, indice `0` = corda più grave (Mi basso, 6ª), indice `5`
= corda più acuta (Mi cantino, 1ª):

```
indice:  0    1    2    3    4    5
corda:   6    5    4    3    2    1
        (Mi) (La) (Re) (Sol)(Si) (Mi)
```

Ogni valore è `"x"` (corda muta) oppure un **tasto assoluto** (`0` = corda a
vuoto). Il tasto per-corda è la fonte di verità del suono e del nome nota
(calcolati dall'accordatura) — la finestra di tasti mostrata e l'eventuale
etichetta di posizione (es. `"5fr"`) si calcolano da questi numeri, non si
memorizzano.

### `fingers` — allineato a `strings` per INDICE

6 posizioni allineate a `strings` per indice (non per numero di corda): dito
che preme quella corda — `1`=indice, `2`=medio, `3`=anulare, `4`=mignolo,
`"T"`=pollice (nota: numeri per le prime quattro dita, stringa solo per il
pollice) — oppure `null` dove non si preme. Campo opzionale: se manca, non
si disegna la diteggiatura.

### `barres` — convenzione a NUMERO DI CORDA (6..1), diversa da `strings`!

**Attenzione**: qui la numerazione è quella "da chitarrista" (corda 6 = Mi
basso, corda 1 = Mi cantino), **non** l'indice array usato da `strings`. È
l'unico punto dello schema dove le due convenzioni convivono — vedi
l'esempio del Fa barré sotto, dove `strings` usa l'indice e `barres` usa il
numero di corda per lo stesso barré.

```json
{ "fret": 1, "fromString": 6, "toString": 1, "finger": 1 }
```

Il barré è **solo indicazione grafica**: non determina il suono. Se una
corda sotto il barré è premuta più in alto, a suonare è comunque il tasto
per-corda in `strings`, mai il tasto del barré.

## Esempi commentati

**Do aperto** — nessun barré, diteggiatura standard:

```json
{
  "id": "c-open",
  "name": "C",
  "variant": "open",
  "strings": ["x", 3, 2, 0, 1, 0],
  "fingers": [null, 3, 2, null, 1, null],
  "barres": []
}
```

**Fa barré (forma di Mi)** — nota il disallineamento tra `strings` (indice
0..5) e `barres` (numero di corda 6..1) per lo stesso barré al primo tasto:

```json
{
  "id": "f-barre-e",
  "name": "F",
  "variant": "barre E-shape",
  "strings": [1, 3, 3, 2, 1, 1],
  "fingers": [1, 3, 4, 2, 1, 1],
  "barres": [{ "fret": 1, "fromString": 6, "toString": 1, "finger": 1 }]
}
```

**Solo nome** — nessuna forma, nessun diagramma disegnato:

```json
{ "id": "bdim-x", "name": "Bdim" }
```

## Import: merge non distruttivo

Importare un file **non cancella mai nulla**:
- accordi con `id` già presente nella lista locale → **aggiornati**;
- accordi con `id` nuovo (o assente, nel qual caso ne viene generato uno) →
  **aggiunti**;
- accordi presenti localmente ma assenti dal file → **restano invariati**.

La cancellazione esiste solo come gesto esplicito dentro l'app (seleziona ed
elimina), mai come effetto collaterale di un import.
