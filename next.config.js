/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '200mb',
    },
  },
  // APIルートのボディサイズ制限を設定
  api: {
    bodyParser: {
      sizeLimit: '200mb',
    },
  },
}

module.exports = nextConfig
