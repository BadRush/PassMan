# PassMan 🛡️

**PassMan** is a secure, self-hosted, and zero-knowledge password manager built for individuals who demand complete control over their sensitive data. Designed with privacy in mind, PassMan ensures your passwords, notes, and credentials are encrypted on your device *before* they ever reach the server.

> **Zero-Knowledge Architecture:** The server never sees your master password or unencrypted data.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Version](https://img.shields.io/badge/Version-1.0.0-green.svg)
![Tech](https://img.shields.io/badge/Next.js-16-black.svg)
![Author](https://img.shields.io/badge/Author-BadRush-purple.svg)

---

## ✨ Features

- **Zero-Knowledge Encryption**: Uses **AES-256-GCM** via the Web Crypto API. Encryption and decryption happen purely on the client side (in your browser).
- **Strong Key Derivation**: Employs **Argon2id** (memory-hard algorithm) via `hash-wasm` to derive keys locally, protecting against brute-force, GPU, and ASIC attacks.
- **Folder Management**: Organize your credentials using customizable folders with nested support.
- **Drag and Drop**: Reorder items and move them between folders easily with `@dnd-kit`.
- **Offline Backup & Restore**: Export your vault securely to an encrypted `.passman` file, and import it anytime.
- **Responsive UI**: A beautiful, dark-themed, glassmorphic design built with Tailwind CSS and Framer Motion.
- **Self-Hosted**: Fully deployable on your own infrastructure with PostgreSQL. Your data, your rules.

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **API**: tRPC for end-to-end type safety
- **Authentication**: NextAuth.js (v5)
- **State Management**: Zustand
- **Styling**: Tailwind CSS & Framer Motion
- **Drag & Drop**: dnd-kit
- **Crypto**: Web Crypto API + `hash-wasm` (Argon2id)

## 🚀 Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- Git

### Quickstart (Docker Compose)

The easiest way to get PassMan up and running is via Docker. The provided `docker-compose.yml` sets up the Next.js app, PostgreSQL database, and Redis.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/BadRush/PassMan.git
   cd PassMan
   ```

2. **Run with Docker Compose:**
   ```bash
   docker compose up -d --build
   ```

3. **Access your Vault:**
   Once the containers are up and running, open your browser and navigate to:
   ```text
   http://localhost:4010
   ```

*(Note: The `docker-compose.yml` automatically provisions the necessary PostgreSQL and Redis instances. No extra configuration is needed out-of-the-box for local testing.)*

## 🔒 Security Model

1. **Master Password**: You choose a master password. It is *never* sent to the server.
2. **Argon2id Hashing**: The browser derives two keys from your master password using two different salts (provided by the server upon email lookup):
   - `AuthKey`: Sent to the server for authentication (hashed again server-side).
   - `EncryptionKey`: Kept exclusively in client-side memory (Zustand state).
3. **Data Encryption**: All vault items (passwords, notes, cards) are encrypted in the browser using the `EncryptionKey` with AES-256-GCM before being sent to the tRPC backend.
4. **Data Decryption**: Data fetched from the server is decrypted locally using the `EncryptionKey`.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Copyright © 2026 BadRush**
