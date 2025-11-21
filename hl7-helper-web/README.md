This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deployment

### Option 1: Vercel (Recommended)
The easiest way to deploy is using [Vercel](https://vercel.com).
1. Push your code to a GitHub repository.
2. Import the project in Vercel.
3. Vercel will automatically detect Next.js and configure the build settings.
4. Click **Deploy**.

### Option 2: Docker
You can containerize the application using Docker.
1. Build the image:
   ```bash
   docker build -t hl7-helper-web .
   ```
2. Run the container:
   ```bash
   docker run -p 3000:3000 hl7-helper-web
   ```
   *(Note: Ensure you have a `Dockerfile` in the root directory. If not, you can use the official Next.js Dockerfile example)*

### Option 3: Static Export (if applicable)
If you don't need server-side features, you can export as a static site:
1. Update `next.config.ts` to include `output: 'export'`.
2. Run:
   ```bash
   npm run build
   ```
3. The `out` directory will contain the static assets which can be hosted on any static hosting service (GitHub Pages, Netlify, AWS S3, etc.).
