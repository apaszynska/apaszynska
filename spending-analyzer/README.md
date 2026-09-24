# Ola's Finanses — analiza wydatków

Prosta aplikacja webowa: wgrywasz CSV z banku i widzisz kategorie wydatków, top merchantów oraz wskazówki „gdzie zaoszczędzić”.

## Uruchomienie

```bash
cd spending-analyzer
npm install
npm run dev
```

Otwórz adres z terminala (zwykle `http://localhost:5173`). Przy starcie ładują się dane demo; możesz też wgrać własny CSV.

Build produkcyjny:

```bash
npm run build
npm run preview
```

## Format CSV

Parser jest elastyczny. Zweryfikowany eksport (N26-style):

| Kolumna | Użycie |
|---|---|
| `Booking Date` | data (YYYY-MM-DD) |
| `Partner Name` | merchant (bez pełnej tożsamości osób przy przelewach P2P) |
| `Amount (EUR)` | kwota (kropka dziesiętna, ujemna = wydatek) |
| `Type` | wskazówka kategorii (MoneyBeam → przelewy, Credit Transfer → wpływy) |
| `Payment Reference` | opis (opcjonalnie) |
| `Original Currency` | waluta |

Pomijane ze względu na prywatność: `Partner Iban`, `Account Name` oraz podobne kolumny (IBAN, numer konta, PESEL…).

Dodatkowo obsługiwane aliasy PL: `Data operacji` / `Kwota`, separator `;` lub `,`, kwoty `1.234,56`, kodowanie UTF-8 / Windows-1250.

## Prywatność

- Prawdziwy wyciąg trzymaj poza repozytorium (np. lokalnie / w prywatnym store).
- W UI widać tylko merchant + kategoria + kwota + data.
- Przelewy do osób prywatnych są anonimizowane jako „Przelew prywatny”.
