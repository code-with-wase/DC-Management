# DC Management API

Express/MongoDB backend for the Deluxe Culture store-management frontend. The same exported Express app runs locally and as a Vercel serverless function.

## Local setup

1. Install Node.js 20 or newer and MongoDB.
2. Set `MONGO_URI`, a unique `JWT_SECRET`, and SMTP settings in `.env` to enable forgot-password emails.
3. Run `npm install`, then `npm run start` (or `npm run dev` while developing).

The default local MongoDB URI uses a standalone database. Invoice and stock operations use MongoDB transactions when supported and fall back to sequential updates on a standalone MongoDB server. For stronger transaction guarantees in production, use MongoDB Atlas or another replica-set deployment.

If system DNS refuses a MongoDB Atlas SRV lookup, the database connector retries that lookup using Google and Cloudflare DNS.

Categories and brands are not seeded; administrators can create, list, update, and delete them through the API. Product references are cleared if their brand or category is deleted. Provision the first administrator securely in MongoDB before using the admin-only API; administrator creation endpoints require an authenticated administrator.

## Vercel deployment

Import the repository into Vercel and set `MONGO_URI`, `JWT_SECRET`, and `JWT_EXPIRES_IN` in the project's Environment Variables. To enable password resets, also set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, optional `SMTP_FROM`, and an HTTPS `RESET_PASSWORD_URL` pointing to the frontend's reset-password page. Deploy; `vercel.json` routes requests to the exported Express app. Do not set `CLIENT_ORIGIN`; the API enables CORS for frontend requests.

## API routes

`GET /` returns a simple API status response. All business routes require `Authorization: Bearer <token>` and administrator role, except `POST /auth/login` and `GET /health`.

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/auth/login` | Sign in |
| `POST` | `/auth/password/forgot` | Request a password reset email (SMTP must be configured) |
| `POST` | `/auth/password/reset` | Set a new password using the emailed token |
| `GET` | `/auth/me` | Current administrator |
| `POST` | `/auth/logout` | Sign out |
| `PATCH` | `/auth/password/update` | Update password |
| `GET` | `/admin/all` | List administrators |
| `POST` | `/admin/create` | Create an administrator |
| `GET`, `POST` | `/product/all`, `/product/create` | List and create products |
| `PATCH`, `DELETE` | `/product/:id/update`, `/product/:id/delete` | Update and delete a product |
| `GET`, `POST` | `/brand/all`, `/brand/create` | List and create brands |
| `PATCH`, `DELETE` | `/brand/:id/update`, `/brand/:id/delete` | Update and delete a brand |
| `GET`, `POST` | `/category/all`, `/category/create` | List and create categories |
| `PATCH`, `DELETE` | `/category/:id/update`, `/category/:id/delete` | Update and delete a category |
| `POST`, `GET` | `/stock/adjust`, `/stock/movements` | Adjust stock and list its movements |
| `GET`, `POST` | `/invoice/all`, `/invoice/create` | List and create invoices |
| `GET`, `PUT` | `/invoice/:id`, `/invoice/:id/update` | Read and update an invoice |
| `POST` | `/invoice/:id/cancel` | Cancel or delete an invoice and restore stock |
| `GET` | `/dashboard/overview` | Dashboard totals and recent invoices |
| `GET` | `/report/sales` | Sales report (`from`, `to`, `period=day|week|month`) |
| `GET` | `/shop/data` | Combined store data |

Product fields: `name`, `sku`, `size`, `color`, `price`, `low_stock`, optional `stock`, `brand_id`, and `category_id`. Invoice requests use `{ "customer": "Walk-in customer", "payment": "Cash", "items": [{ "product_id": "...", "quantity": 1, "price": 1899 }] }`.

Password reset requests use `{ "email": "admin@example.com" }`. The reset page should read `email` and `token` from its query string and submit `{ "email": "...", "token": "...", "newPassword": "..." }` to `/auth/password/reset`. Tokens are single-use and expire after 15 minutes. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, optional `SMTP_FROM`, and `RESET_PASSWORD_URL` in local environment and Vercel settings.

Responses use `{ "data": ... }`; errors use `{ "error": { "message": "..." } }`. The frontend must replace its local-storage data adapter with HTTP requests and persist the returned bearer token.
