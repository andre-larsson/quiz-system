# quiz-system

Modulärt quizsystem byggt med Vite + React, deployat till GitHub Pages.

## Live URL

`https://andre-larsson.github.io/quiz-system/`

## Lägg till nya quizfrågor

Skapa/uppdatera en JSON-fil i `public/quizzes/`.

Exempel:

```json
{
  "title": "Intervallquiz (Svenska)",
  "version": 1,
  "questions": [
    {
      "id": "q1",
      "question": "Hur många halvtoner är en ren kvint?",
      "options": ["5", "6", "7", "8"],
      "correctIndex": 2,
      "image": "/images/minbild.png"
    }
  ]
}
```

### Fält
- `id` (string)
- `question` (string)
- `options` (array av strings, minst 2)
- `correctIndex` (number, index i `options`)
- `image` (optional, string-path)

## Lokal utveckling

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
