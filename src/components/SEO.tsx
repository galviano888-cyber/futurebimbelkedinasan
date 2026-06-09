import { Helmet } from 'react-helmet-async';

const BASE_URL = 'https://futurebimbelkedinasan.com';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  noIndex?: boolean;
}

export const SEO = ({
  title = "Future Bimbel Kedinasan | Bimbel SKD CPNS & Sekolah Kedinasan Online",
  description = "Bimbel persiapan SKD CPNS dan sekolah kedinasan (IPDN, STAN, STIS, POLTEKIP) online. Tryout CAT BKN interaktif, bank soal TWK, TIU, TKP terlengkap, dan pembahasan detail. Mulai belajar gratis!",
  keywords = "bimbel kedinasan, tryout skd online, soal skd cpns, ipdn, stan, stis, poltekip, poltekim, bkn, cat bkn, twk, tiu, tkp, passing grade skd, bimbel online kedinasan, persiapan cpns 2026",
  image = DEFAULT_OG_IMAGE,
  url = BASE_URL,
  type = "website",
  noIndex = false,
}: SEOProps) => {
  const siteTitle = title.includes("Future Bimbel") ? title : `${title} | Future Bimbel Kedinasan`;
  const fullImage = image.startsWith('http') ? image : `${BASE_URL}${image}`;
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;

  return (
    <Helmet>
      {/* Primary */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Future Bimbel Kedinasan" />
      <link rel="canonical" href={fullUrl} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Future Bimbel Kedinasan" />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:locale" content="id_ID" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
    </Helmet>
  );
};
