# Filip Jarolím

Black-and-white portfolio. Selected GitHub repositories stay live. LinkedIn lines and the résumé are the ones chosen in `src/content/selection.ts`.

No API keys are required. Public GitHub data is cached for about an hour. `GITHUB_TOKEN` is optional and only raises the rate limit.

## Choose what shows

Edit `src/content/selection.ts`.

- `selectedRepos` — the only repositories on the site. The PDF is edited in `cv/resume.tex`
- `selectedPosts` — LinkedIn posts, empty until you add a URL, title, and date
- `experience` — jobs, empty until there is one to list

## CV

The CV is Jake Gutierrez’s LaTeX template in `cv/resume.tex`. The site serves the compiled PDF at `/cv.pdf`.

```bash
export PATH="$PATH:$HOME/Library/TinyTeX/bin/universal-darwin"
pdflatex -interaction=nonstopmode -output-directory=cv cv/resume.tex
cp cv/resume.pdf public/cv.pdf
```

## Scripts

```bash
npm run build
npm start
```
