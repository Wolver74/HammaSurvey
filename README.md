# AL Maghrebia Assurance — Sondage en ligne

Application MERN de collecte et d'analyse de données pour AL Maghrebia Assurance. Comprend un sondage public bilingue (français) et un dashboard d'analyse protégé.

---

## Prérequis

- **Node.js 18+**
- **MongoDB** en cours d'exécution en local (`mongod`) ou via MongoDB Compass
- npm 9+

---

## Installation & démarrage

```bash
# 1. Cloner / extraire le projet
cd project-root

# 2. Installer les dépendances racine
npm install

# 3. Installer les dépendances serveur
cd server && npm install && cd ..

# 4. Installer les dépendances client
cd client && npm install && cd ..

# 5. Lancer en mode développement (serveur + client en même temps)
npm run dev
```

- **Sondage** → [http://localhost:5173](http://localhost:5173)
- **Dashboard** → [http://localhost:5173/dashboard](http://localhost:5173/dashboard)
- **API** → [http://localhost:5000/api/responses](http://localhost:5000/api/responses)

---

## Accès au Dashboard

La clé d'accès par défaut est :

```
maghrebia2024
```

---

## Changer la clé d'accès

Éditez le fichier `server/.env` :

```env
DASHBOARD_PASSKEY=votre_nouvelle_cle
```

Puis redémarrez le serveur.

---

## Endpoints API

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| `POST` | `/api/responses` | Public | Soumettre une réponse au sondage |
| `GET` | `/api/responses` | Protégé (`x-passkey` header) | Récupérer toutes les réponses |
| `DELETE` | `/api/responses/:id` | Protégé (`x-passkey` header) | Supprimer une réponse |

### Exemple de payload POST

```json
{
  "ageRange": "26-35",
  "fullName": "Ahmed Ben Ali",
  "email": "ahmed@example.com",
  "profession": "Ingénieur",
  "insuranceCompany": "STAR",
  "satisfactionScore": 7,
  "hasLifeInsurance": true,
  "lifeInsuranceType": "maladie",
  "annualPremium": 800,
  "switchReasons": ["Fiabilité", "Qualité du service"],
  "interested": true,
  "phone": "+216 22 000 000"
}
```

---

## Structure du projet

```
project-root/
├── server/              # API Express + Mongoose
│   ├── models/          # Schéma MongoDB
│   ├── routes/          # Routes API
│   ├── middleware/       # Middleware passkey
│   ├── .env             # Variables d'environnement
│   └── index.js         # Point d'entrée
├── client/              # React + Vite + Tailwind CSS v4
│   └── src/
│       ├── pages/       # Survey.jsx, Dashboard.jsx
│       └── components/  # Navbar, ResponseTable, charts/
└── package.json         # Scripts concurrents
```
