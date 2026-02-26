# dev.francescomelani.com

Progetto collegato al sottodominio **dev.francescomelani.com** su Hostinger.  
Sviluppi in locale, push su GitHub → deploy automatico sul sottodominio.

---

## Sottodominio e percorso

- **URL:** https://dev.francescomelani.com  
- **Directory su Hostinger:**  
  `/home/u705656439/domains/francescomelani.com/public_html/dev`

---

## 1. Versionamento con GitHub

### Inizializzare Git (se non l’hai già fatto)

```bash
cd /Users/astuser/dev-francescomelani
git init
git add .
git commit -m "Setup iniziale – deploy su dev.francescomelani.com"
```

### Creare il repository su GitHub

1. Vai su [github.com/new](https://github.com/new) (con il tuo account [FRANCO1357](https://github.com/FRANCO1357)).
2. Nome repo (es. `dev-francescomelani` o `francescomelani-dev`).
3. Scegli **Public** (o Private se preferisci).
4. **Non** spuntare “Add a README” (ce l’hai già in locale).
5. Clicca **Create repository**.

### Collegare il repo e fare il primo push

Nella pagina del nuovo repo GitHub vedrai i comandi. Con il tuo account [**FRANCO1357**](https://github.com/FRANCO1357), se chiami il repo `dev-francescomelani`:

```bash
git remote add origin https://github.com/FRANCO1357/dev-francescomelani.git
git branch -M main
git push -u origin main
```

(Se scegli un altro nome per il repository, sostituisci `dev-francescomelani` nell’URL.)

---

## 2. Deploy automatico su Hostinger

Il deploy avviene con **GitHub Actions** tramite SFTP verso la cartella del sottodominio.

### 2.1 Abilitare SSH su Hostinger

1. Accedi a **hPanel** (Hostinger).
2. **Advanced** → **SSH Access**.
3. Abilita SSH e annota:
   - **Host / IP**
   - **Porta** (solitamente **65002** per hosting condiviso)
   - **Username** (es. `u705656439`)

### 2.2 Chiave SSH per il deploy

Sul tuo Mac:

```bash
ssh-keygen -t ed25519 -C "deploy-dev-francescomelani" -f ~/.ssh/hostinger_deploy -N ""
```

- **Pubblica:** `~/.ssh/hostinger_deploy.pub`  
- **Privata:** `~/.ssh/hostinger_deploy`

Aggiungi la **chiave pubblica** su Hostinger:

- **hPanel** → **Advanced** → **SSH Access** → **SSH Keys**  
- Incolla il contenuto di `~/.ssh/hostinger_deploy.pub` e salva.

### 2.3 Secrets su GitHub

Nel repository GitHub:

1. **Settings** → **Secrets and variables** → **Actions**.
2. **New repository secret** per ognuno di questi:

| Nome del secret              | Valore |
|-----------------------------|--------|
| `HOSTINGER_SSH_USER`        | Username SSH (es. `u705656439`) |
| `HOSTINGER_SSH_HOST`        | Host/IP del server (es. `srv123.hostinger.com` o l’IP che vedi in SSH Access) |
| `HOSTINGER_SSH_PORT`        | Porta SSH (es. `65002`) |
| `HOSTINGER_SSH_PRIVATE_KEY`| Contenuto **completo** del file `~/.ssh/hostinger_deploy` (incluse le righe `-----BEGIN ...` e `-----END ...`). **Importante:** lascia una riga vuota alla fine. |

Dopo aver configurato i 4 secrets, ogni **push su `main`** (e l’avvio manuale del workflow) farà il deploy nella directory del sottodominio.

---

## 3. Flusso di lavoro

1. **Sviluppo in locale** nella cartella del progetto.
2. **Commit e push** su GitHub:
   ```bash
   git add .
   git commit -m "Descrizione delle modifiche"
   git push origin main
   ```
3. **Deploy automatico:** GitHub Actions carica i file su  
   `dev.francescomelani.com` (cartella `/home/u705656439/domains/francescomelani.com/public_html/dev`).
4. Controlla l’esito in **Actions** nel tab del repository GitHub.

---

## 4. Deploy manuale

- Vai su **Actions** → workflow **“Deploy to dev.francescomelani.com”** → **Run workflow** → **Run workflow**.

---

## 5. Prossimi passi (opzionale)

- Se userai **Node/npm** (es. React, Vite, Next.js):
  - Apri `.github/workflows/deploy.yml`.
  - Decommenta e adatta la sezione **Setup Node** e **Install & Build**.
  - Imposta `local_path` sulla cartella di build (es. `./dist/*` o `./build/*`) invece di `./*`.

Se vuoi, al prossimo step possiamo configurare proprio un progetto Node/React/Vite in questa repo.
