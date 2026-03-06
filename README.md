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

## 2. Deploy automatico su Hostinger (SSH/SFTP)

Il deploy avviene con **GitHub Actions** tramite **SSH/SFTP** (connessione cifrata, più sicura dell'FTP).

### 2.1 Abilitare SSH e dati su Hostinger

1. Accedi a **hPanel** (Hostinger).
2. Vai in **Advanced** → **SSH Access**.
3. Abilita SSH (se non è già attivo) e annota:
   - **Hostname** (o IP del server)
   - **Porta** (solitamente **65002** per hosting condiviso)
   - **Username** (es. `u705656439`)

### 2.2 Chiave SSH per il deploy

Sul tuo computer genera una chiave dedicata al deploy:

```bash
ssh-keygen -t ed25519 -C "deploy-dev-francescomelani" -f ~/.ssh/hostinger_deploy -N ""
```

- **Chiave pubblica:** `~/.ssh/hostinger_deploy.pub` → da aggiungere su Hostinger (**SSH Access** → **SSH Keys**).
- **Chiave privata:** `~/.ssh/hostinger_deploy` → da mettere nei GitHub Secrets (mai condividerla).

### 2.3 Secrets su GitHub (SSH)

Nel repository GitHub:

1. **Settings** → **Secrets and variables** → **Actions**.
2. **New repository secret** per ognuno di questi **4**:

| Nome del secret               | Valore |
|------------------------------|--------|
| `HOSTINGER_SSH_USER`         | Username SSH (es. `u705656439`) |
| `HOSTINGER_SSH_HOST`         | Hostname o IP del server (da SSH Access) |
| `HOSTINGER_SSH_PORT`         | Porta SSH (es. `65002`) |
| `HOSTINGER_SSH_PRIVATE_KEY`  | Contenuto **completo** del file `~/.ssh/hostinger_deploy` (incluse le righe `-----BEGIN ...` e `-----END ...`). Lascia una riga vuota alla fine. |

Dopo aver configurato i 4 secrets, ogni **push su `main`** (e l'avvio manuale del workflow) farà il deploy nella directory del sottodominio tramite SFTP.

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

## 4. Laravel e database Hostinger

Il backend Laravel si trova in **`backend/`** e può essere collegato al database MySQL di Hostinger.

### 4.1 Creare il database su Hostinger

1. In **hPanel** → **Databases** → **MySQL Databases**.
2. Crea un nuovo database (es. `u705656439_dev`).
3. Crea un utente MySQL e assegnalo al database (con tutti i privilegi).
4. Annota: **host** (solitamente `localhost`), **nome database**, **username**, **password**. Su Hostinger l'host MySQL è spesso `localhost`; il nome utente è nel formato `u705656439_nomeutente`.

**Credenziali DB per questo progetto:** username `dev_francesco`, password `Dev_francesco1`. Usale in `backend/.env` (`DB_USERNAME`, `DB_PASSWORD`) e nel file `.env` su Hostinger dopo il deploy.

### 4.2 Configurare Laravel in locale

1. Installa PHP (≥ 8.2) e [Composer](https://getcomposer.org/) sul tuo Mac.
2. Dalla root del progetto:
   ```bash
   cd backend
   cp .env.example .env
   php artisan key:generate
   composer install
   ```
3. Modifica **`backend/.env`** e imposta le variabili del database:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=localhost
   DB_PORT=3306
   DB_DATABASE=nome_database_hostinger
   DB_USERNAME=utente_hostinger
   DB_PASSWORD=password_hostinger
   ```
4. Per provare in locale: `php artisan serve` e apri http://localhost:8000. La route **http://localhost:8000/db-check** restituisce un JSON con l'esito della connessione al DB.

### 4.3 Configurare il database su Hostinger (dopo il deploy)

Sul server Hostinger, nella cartella del progetto, crea o modifica **`backend/.env`** con le stesse variabili `DB_*` (usa i dati del database creato in hPanel). Non mettere il file `.env` nel repository: va creato direttamente sul server (es. da File Manager o via SSH).

---

## 5. Deploy manuale

- Vai su **Actions** → workflow **“Deploy to dev.francescomelani.com”** → **Run workflow** → **Run workflow**.

---

## 6. Prossimi passi (opzionale)

- Se userai **Node/npm** (es. React, Vite, Next.js):
  - Apri `.github/workflows/deploy.yml`.
  - Decommenta e adatta la sezione **Setup Node** e **Install & Build**.
  - Imposta `local_path` sulla cartella di build (es. `./dist/*` o `./build/*`) invece di `./*`.

Se vuoi, al prossimo step possiamo configurare il **deploy di Laravel** su dev.francescomelani.com (document root verso `backend/public` e `composer install` in pipeline).
