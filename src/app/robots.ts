import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/login', '/register', '/submit'],
      },
    ],
    sitemap: 'https://shellbook.io/sitemap.xml',
  }
}
