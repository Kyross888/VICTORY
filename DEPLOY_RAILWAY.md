# 🚂 Railway Deployment Guide — Luna's POS

## Step 1: Create a New Project on Railway
1. Go to https://railway.app → **New Project**
2. Choose **"Deploy from GitHub repo"** (or **"Empty project"** for manual upload)

---

## Step 2: Add a MySQL Database
1. Inside your project, click **"+ New"** → **"Database"** → **"MySQL"**
2. Railway will auto-provision a MySQL instance
3. Click the MySQL service → **"Variables"** tab
4. Copy these values (you'll see them auto-generated):
   - `MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`, `MYSQLUSER`, `MYSQLPASSWORD`

---

## Step 3: Deploy the App
### Option A — GitHub (recommended)
1. Push this folder to a GitHub repo
2. In Railway: **"+ New"** → **"GitHub Repo"** → select your repo
3. Railway auto-detects the `Dockerfile` and builds it

### Option B — Railway CLI
```bash
npm install -g @railway/cli
railway login
railway link        # link to your project
railway up          # deploy current folder
```

---

## Step 4: Set Environment Variables
In your **app service** on Railway → **Variables** tab, add:

| Variable | Value |
|---|---|
| `MYSQLHOST` | (copy from MySQL service) |
| `MYSQLPORT` | (copy from MySQL service) |
| `MYSQLDATABASE` | (copy from MySQL service) |
| `MYSQLUSER` | (copy from MySQL service) |
| `MYSQLPASSWORD` | (copy from MySQL service) |

> ✅ Railway can also **auto-link** your MySQL service to your app — click "Add Reference" and it fills these in automatically.

---

## Step 5: Import the Database Schema
1. In Railway, click your **MySQL service** → **"Connect"** tab
2. Use the provided connection string with any MySQL client (TablePlus, DBeaver, MySQL Workbench)
3. Run the contents of `schema.sql` to create all tables and seed data

Or use Railway's built-in query editor if available.

---

## Step 6: Access Your App
- Railway gives you a public URL like: `https://lunas-pos-production.up.railway.app`
- Open it → redirects to `/login.html`
- **Default admin login:**
  - Email: `admin@lunas.com`
  - Password: `admin123`
  - Role: **Admin**

---

## 🔧 Environment Variables Summary

```
MYSQLHOST=your-railway-mysql-host
MYSQLPORT=3306
MYSQLDATABASE=railway
MYSQLUSER=root
MYSQLPASSWORD=your-auto-generated-password
```

---

## 📁 File Structure on Server
```
/var/www/html/
├── api/              ← PHP backend endpoints
│   ├── auth.php
│   ├── products.php
│   ├── orders.php
│   ├── dashboard.php
│   ├── sales_report.php
│   ├── customers.php
│   ├── admin_stats.php
│   └── forgot_password.php
├── js/
│   └── api.js
├── img/              ← Product images (upload via admin panel)
├── db.php            ← DB connection (reads env vars)
├── schema.sql        ← Run once to set up DB
├── login.html
├── dashboard.html
└── ... (all other HTML pages)
```
