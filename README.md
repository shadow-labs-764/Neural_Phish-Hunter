# 🎯 Neural Phish-Hunter

An AI-driven, privacy-first web application that analyzes URL lexical structures to detect zero-day phishing threats, secured via a zero-trust Tailscale mesh.

## 🛡️ Project Philosophy
Traditional blacklist-based phishing detection fails against zero-day threats. Neural Phish-Hunter takes a predictive approach. By mathematically analyzing the anatomical structure and lexical tokens of a URL using a trained Machine Learning classifier, this tool provides real-time threat intelligence without relying on external sandbox lookups. 

Built with a strict privacy-first ethos, the public interface requires no login and collects no user data—only the suspicious URLs are processed.

## 🌐 Live Demo

try out the neural-phish_hunter application using this demo link: **[nexus-lab.tech](https://nexus-lab.tech)**

## ✨ Key Features
* **AI Lexical Analysis:** Utilizes a custom TF-IDF vectorizer and Logistic Regression model (Scikit-Learn) to score URLs instantly.
* **Zero-Friction Public Interface:** A clean, "Public Trust" aesthetic for everyday users to scan URLs anonymously.
* **Dual-Theme Architecture:** Client-side CSS variable toggle to switch between Public Trust and a high-contrast "Technocrat" aesthetic.
* **Hidden Command Portal:** A clandestine, multi-tap developer portal granting access to historical scan logs via secure session cookies.
* **Zero-Trust Infrastructure:** The MySQL database is completely isolated on a secondary Azure node, accessible only to the Node.js backend via an encrypted WireGuard (Tailscale) mesh.

## 🛠️ Technology Stack
* **Frontend:** HTML5, CSS3 (Grid/Flexbox/CSS Variables), Vanilla JavaScript (AJAX/Fetch API)
* **Backend:** Node.js, Express.js (Bridging via `child_process`)
* **ML Engine:** Python 3, Scikit-Learn, Pandas, Joblib
* **Database:** MySQL 8.0 (Strict least-privilege configuration)
* **Infrastructure:** Microsoft Azure, PM2, Nginx, Cloudflare, Tailscale

## 🏗️ Architecture Overview
This system operates on a multi-node distributed architecture:
1. **Node 1 (API \u0026 ML Edge):** Hosts the Express API and the headless Python inference script. Routes incoming client requests, spawns the ML process, and returns the JSON autopsy.
2. **Node 2 (The Vault):** A heavily restricted database instance stripped of its public IP. Only accepts port 3306 traffic originating from Node 1's specific `100.x.x.x` Tailscale IP.

## 🚀 Development \u0026 Setup

This repository is optimized for **GitHub Codespaces**. 

1. Launch a new Codespace from the `main` branch.
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Setup your local `.env` file with your Tailscale database credentials.
5. Run the development server:
   ```bash
   npm run dev
   ```

## 🎓 Academic Context
This project was developed as a Minor Project Submission for B.Tech CSE (Cybersecurity), focusing on secure web development, cross-process API orchestration, and zero-trust cloud deployment.
