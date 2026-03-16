# OpenlyMarket

[![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=nextdotjs&logoColor=white)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)]()
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)]()
[![Tailwind](https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)]()
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)]()
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)]()

A modern **buyer–seller marketplace platform** built with **Next.js, Supabase, and Tailwind CSS**.

OpenlyMarket introduces a **request-driven commerce model** where buyers publish requests and sellers compete with offers, powered by secure escrow payments and real-time deal rooms.

---

# Preview

*(Add screenshots here later)*


---

# Core Features

## Authentication

Multi-provider authentication powered by **Auth0**.

Supported login methods:

- Email passwordless
- Google
- Apple
- WalletConnect
- Telegram login

---

## Role System

Users can join as:

- **Buyer**
- **Seller**
- **Investors**

Roles can be assigned automatically using **invite codes**.

---

## Request-Based Marketplace

Unlike traditional listings, OpenlyMarket uses **buyer requests**.

Workflow:

Buyer posts request
↓
Sellers submit offers
↓
Buyer accepts best offer
↓
Deal Room is created


---

## Deal Room

Each accepted offer creates a **real-time collaboration environment**.

Features:

- Buyer ↔ Seller chat
- Deal status timeline
- Escrow tracking
- Payment verification

Built using **Supabase Realtime**.

---

## Escrow Payments

Secure multi-chain escrow system.

Supported networks:

- Ethereum
- Polygon
- Base
- Bitcoin

Escrow flow:

Buyer pays
↓
Funds locked in escrow
↓
Seller fulfills order
↓
Funds released


A **mock payment adapter** is included for development environments.

---

## Wallet Escrow System

Users can connect wallets and receive payouts.

Process:

1. Wallet ownership verified
2. Escrow holds payment
3. Admin releases payout
4. Full audit trail logged

---

## Onboarding Wizard

New users complete onboarding after signup.

Steps:

- Choose role (Buyer / Seller)
- Connect payout wallet
- Verify Telegram (mock flow)

Route:

/onboarding


