# DAXCASES — custom phone case shop

Next.js shop in Albanian (`/sq`) and English (`/en`): design categories, an online case designer
(photo, text, emoji, background) with a 3D preview, iPhone and Samsung models, cash-on-delivery
checkout for Kosovo, Albania and North Macedonia, and an owner dashboard at `/admin`.

## Put it online (about 30 minutes, all free except the domain)

### 1. Upload the code to GitHub
1. Create an account at github.com.
2. Click **+ → New repository**, name it `daxcases`, choose **Private**, click **Create repository**.
3. On the next page click **uploading an existing file**.
4. Unzip `daxcases.zip`, open the `phonecase` folder, select everything inside it and drag it
   into the GitHub page. Click **Commit changes**.

### 2. Deploy on Vercel
1. Create an account at vercel.com with **Continue with GitHub**.
2. Click **Add New → Project**, find `daxcases`, click **Import**, then **Deploy**.
   (The first visit will show an error until step 3 is done. That is expected.)

### 3. Add the database and image storage
In the Vercel project open the **Storage** tab:
1. **Create Database → Neon (Postgres)** → Continue → Create → **Connect** to the project.
2. **Create Database → Blob** → Create → **Connect** to the project.

### 4. Set the passwords
**Settings → Environment Variables**, add each one and press Save:

| Name | Value |
| --- | --- |
| `ADMIN_PASSWORD` | the owner password for `/admin` (pick a strong one) |
| `SESSION_SECRET` | any long random text, 30+ characters |
| `RESEND_API_KEY` | optional, for order emails (step 6) |

### 5. Redeploy
**Deployments →** the top one **→ ⋯ → Redeploy**. The shop is now live at `your-project.vercel.app`.
Tables and ten sample designs are created automatically on the first visit.

### 6. Order emails (optional)
1. Create a free account at resend.com and copy an **API key**.
2. Add it in Vercel as `RESEND_API_KEY` and redeploy.
3. In `/admin` → **Prices**, enter the address under **Order emails** and save.

Without your own domain in Resend, emails can only go to the address you signed up to Resend with.
To send to any address, add your domain in Resend → **Domains**, then set `EMAIL_FROM` in Vercel,
for example `DAXCASES <orders@daxcases.com>`.

### 7. Telegram alerts for new orders (optional)
1. In Telegram, open **@BotFather**, send `/newbot`, follow the steps and copy the **token**.
2. Add it in Vercel as `TELEGRAM_BOT_TOKEN` and redeploy.
3. Open your new bot in Telegram and press **Start**.
4. Send `/start` to **@userinfobot** to see your chat ID.
5. In `/admin` → **Prices**, enter the chat ID under **Telegram**, save, then press **Send a test**.

### 8. Your domain
1. Vercel → **Settings → Domains** → type `daxcases.com` → **Add**.
2. Vercel shows one or two DNS records. Log in where you bought the domain, open its **DNS**
   settings, and add exactly those records (usually an `A` record for `@` and a `CNAME` for `www`).
3. Wait until Vercel shows **Valid Configuration** (minutes, sometimes a few hours).

## Owner dashboard (`/admin`)

The owner signs in with the email field empty and `ADMIN_PASSWORD`.

- **Orders** — every order with customer, address, amount to collect and status. Each row has
  **Copy details** (customer data ready to paste), **↓ JPG / ↓ PNG** (the customer's design) and **Delete**.
- **Statistics** — orders, cases sold and sales per country, plus top cities, models and designs.
- **Shipping & stock** — tick orders and move them to *shipped*, type the post code for each,
  mark delivered, and keep the stock of blank cases per model. An order lowers the stock, a
  cancelled order puts it back, and a model at 0 is hidden from the shop.
- **Designs / Categories** — upload designs, name them, group them. Choose type **Sticker** to
  upload small pictures customers place on top of their design.
- **Marketing** — the email pop-up with its welcome discount (on/off, percent), loyalty (every Nth
  case free, counted by phone number), the list of email sign-ups, the waiting list for
  out-of-stock models, and bulk order requests.
- **Offers & codes** — OFERTA BOX pack prices for 2, 3, 4… cases (the customer chooses a pack in
  the basket), and discount codes: a code plus a percentage off, which you can switch on or off.
- **Materials** — switch case materials on or off, or add a new one with its own prices.
- **Phone models** — add a new model (name, width, height, camera style), switch models on or off.
- **Prices** — case price per material, the extra for a personalised case, shipping per country,
  the email that receives new orders, and your Instagram and TikTok usernames (shown with
  their logos at the bottom of every page).
- **Users** — add people as **Admin** (everything), **Editor** (orders, designs, categories) or
  **Shipping** (only the shipping & stock page).

Customers can put several cases in one order: after designing a case they land in the basket,
where they can add another one or continue to their details.

Customers can follow an order at `/sq/track` with their order number. They see the status, the
post code and what they ordered, never the name, phone or address. Once at least two of your
designs have been ordered, a **Bestsellers** row appears on the home page. A WhatsApp number
saved under **Prices** adds a green chat button to every page.

Also in the shop: a 3-question quiz (`/sq/quiz`), a bulk order form (`/sq/wholesale`), a "notify
me" button on models that are out of stock, a reminder bar for visitors who left cases in the
basket, and saved delivery details for returning customers. In the designer: stickers, name and
number templates (jersey, number plate, vertical name, name with heart), and text with outline,
shadow or on an arc.

Default prices: Kosovo 12 € with free shipping; a personalised case (own photo, text or emoji)
is 3 € more, so 15 €. Albania and North Macedonia use the same prices in their own currency.

## Things to change in the code

| What | Where |
| --- | --- |
| Shop name, phone number | `lib/config.ts` |
| Home page photo | replace `public/hero.jpg` |
| Dark mode colours | `html.dark` in `app/globals.css` |
| Button colour (red) | `--color-brand` in `app/globals.css` |
| Materials, edge colours, default prices | `lib/config.ts` |
| Cities | `lib/locations.ts` |
| All Albanian / English text | `lib/i18n.ts` |

## Run on your own computer

```
npm install
npm run dev
```

Open http://localhost:3000. Locally it needs no setup: data is kept in the `.data` folder and the
owner password is `admin`.
