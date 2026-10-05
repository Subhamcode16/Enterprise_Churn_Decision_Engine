/** @type {import('next').NextConfig} */
function getSanitizedApiUrl() {
  let rawUrl = (process.env.NEXT_PUBLIC_API_URL || "").trim();
  
  // If user accidentally pasted multi-line key=value block, extract the actual http/https URL
  if (rawUrl.includes("http")) {
    const match = rawUrl.match(/https?:\/\/[^\s\n"']+/);
    if (match) {
      rawUrl = match[0];
    }
  }

  if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
    return "http://127.0.0.1:8000";
  }

  return rawUrl.replace(/\/+$/, "");
}

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const apiUrl = getSanitizedApiUrl();
    return [
      {
        source: "/api/proxy/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
