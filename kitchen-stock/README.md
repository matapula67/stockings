# JikoStock (Stock ya Jikoni)

Web app ya kurecord stock na kutrack mauzo ya jikoni, yenye **backend** (Node/Express) na majukumu mawili: **user** na **admin**.

## Vipengele
- Register / Sign in (nenosiri linahifadhiwa kwa bcrypt, session kwa JWT)
- Sheet: date, item, open, in, total, sales, closing, system, debt
- Hesabu automatic: `total = open + in`, `closing = total - sales`
- **User**: anajaza sheet, anahifadhi (Hifadhi), anaona na kupakua CSV ya rekodi zake, ripoti na PDF
- **Admin**: anaingia na kuona rekodi zote zilizohifadhiwa na watumiaji, anaweza **kuzihariri**, kuzifuta, kuchuja kwa mtumiaji, kuona ripoti (ya rekodi moja au ya wote) na kupakua CSV/PDF
- Ripoti ya bidhaa iliyouzika zaidi/kidogo kwa siku, wiki, mwezi, na mapendekezo
- Lugha: Kiswahili / English, Mode: dark / light

Kumbuka: rekodi zilizohifadhiwa haziwezi kuhaririwa na user wa kawaida, ni admin tu.

## Muundo
```
kitchen-stock/
├── server.js        # Express API (auth, sheet, saves, admin)
├── package.json
├── public/index.html  # frontend
├── .env.example
└── README.md
```

## Kuiendesha kwenye kompyuta
```bash
npm install
ADMIN_CODE=msimbo-wa-admin JWT_SECRET=siri-ndefu npm start
```
Fungua http://localhost:3000 . Ukurasa wa kwanza una chaguo la **Mtumiaji / Admin** na **Ingia / Jisajili**.
- User wa kawaida anajisajili moja kwa moja.
- Admin anajisajili kwa kuweka **msimbo wa admin** (`ADMIN_CODE`). Bila msimbo sahihi hakuna anayeweza kuwa admin. Kwenye maendeleo (bila `ADMIN_CODE`) msimbo wa mfano ni `admin2026`. Kwenye production lazima uuweke mwenyewe.
- Akaunti ya User haiwezi kuingia kama Admin na kinyume chake.

## GitHub
```bash
git init
git add .
git commit -m "Kitchen Stock v2: backend with admin role"
git branch -M main
git remote add origin https://github.com/USERNAME/kitchen-stock.git
git push -u origin main
```

## Deploy
GitHub Pages **haiwezi** tena kwa sababu app sasa ina server. Tumia **Render** (au Railway/Fly.io):

1. render.com → New → Web Service → chagua repo yako ya GitHub.
2. Build Command: `npm install` · Start Command: `npm start`
3. Environment variables: `NODE_ENV=production`, `ADMIN_CODE` (msimbo wa siri wa kujisajili admin), `JWT_SECRET` (string ndefu ya siri).
4. **Data isipotee**: data inahifadhiwa kwenye faili (`db.json`). Kwenye Render ongeza **Disk** (mfano mount path `/var/data`) kisha weka `DATA_DIR=/var/data`. Bila disk, data inafutika kila server inapo-restart/deploy (plan ya bure haina disk).
5. Deploy. Utapata link kama `https://kitchen-stock.onrender.com`.

## Hatua zinazofuata (kwa matumizi makubwa)
- Kubadilisha faili la JSON kuwa database halisi (PostgreSQL / SQLite / Supabase)
- Rate limiting kwenye login, na HTTPS ni lazima (Render inatoa automatic)
- Kubadilisha nenosiri na kureset nenosiri
