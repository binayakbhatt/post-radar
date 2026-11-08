# Post Radar — India Post Field Intelligence PWA

**Post Radar** is a mobile-first Progressive Web App (PWA) designed for India Post field officers, Postal Inspectors, and marketing executives. It streamlines institutional marketing, lead tracking, GPS-based area discovery, and performance logging across Mails, Parcel, POSB, and PLI/RPLI services.

---

## 🌟 Key Features

* **Live GPS Area Radar & Auto-Discovery:** Automatically scans and maps nearby institutions (Schools, Hospitals, Banks, Police Stations, Factories, and Tea Estates) using OpenStreetMap Overpass and Mappls integrations within a 30km radius.
* **Exhaustive Category & Custom Pitch Management:** Pre-configured with regional business categories plus a dynamic **"Other"** option to add custom institution types on the fly. Admins can configure tailored product pitches and talk tracks per category.
* **Interactive Lead Management & Visit Logs:** Field officers can log visit remarks, schedule follow-up dates, and add leads to their personal or divisional execution diaries.
* **Secure Cloudflare D1 Backend:** Lightning-fast serverless API endpoints backed by SQLite (<50ms response times) with secure session authentication and role-based permissions (Executive, Admin, Super Admin).
* **Responsive, Mobile-First UI:** Built with React, Vite, Tailwind CSS, and Leaflet Maps for effortless field operation on mobile devices and desktops.

---

## 🛠️ Technology Stack

* **Frontend:** React 19, Vite, Tailwind CSS, TanStack React Query, Leaflet / React-Leaflet
* **Backend:** Cloudflare Workers (Serverless JavaScript), Cloudflare D1 (SQLite Database)
* **Hosting:** GitHub Pages (Static Frontend PWA)

---

## 🚀 Getting Started Locally

### Prerequisites

* Node.js (v18+)
* npm or pnpm

### 1. Clone the Repository

```bash
git clone https://github.com/binayakbhatt/post-radar.git
cd post-radar

```

### 2. Install Frontend Dependencies

```bash
npm install

```

### 3. Run Development Server

```bash
npm run dev

```

---

## 📦 Deployment & Configuration

### Frontend (GitHub Pages)

Configured via GitHub Actions (`.github/workflows/deploy.yml`). Ensure your Vite base path in `vite.config.js` matches your repository name:

```javascript
base: '/post-radar/',

```

### Backend (Cloudflare Workers & D1)

1. Deploy the worker script (`worker/index.js`) to your Cloudflare account.
2. Bind your Cloudflare D1 database instance to the worker using the variable name `DB`.
