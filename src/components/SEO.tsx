import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

export const SEO = ({
  title = "Future Bimbel Kedinasan | Persiapan Tes SKD #1 Indonesia",
  description = "Partner strategis nomor satu untuk raih kursi sekolah kedinasan impianmu. Kami fokus memberikan pendampingan intensif dengan materi terakurat dan sistem simulasi CAT yang presisi demi mencetak calon abdi negara terbaik.",
  keywords = "bimbel kedinasan, tryout skd, ipdn, stan, stis, poltekip, cpns, cat bkn",
  image = "/og-image.png",
  url = "https://futurebimbel.com",
  type = "website"
}: SEOProps) => {
  const siteTitle = title.includes("Future Bimbel") ? title : `${title} | Future Bimbel Kedinasan`;

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};
