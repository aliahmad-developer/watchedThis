interface Crumb {
  name: string;
  href: string;
}

interface BreadcrumbsProps {
  crumbs: Crumb[];
}

export default function Breadcrumbs({ crumbs }: BreadcrumbsProps) {
  // if (crumbs.length <= 1) return null;

  // const schema = {
  //   '@context': 'https://schema.org',
  //   '@type': 'BreadcrumbList',
  //   itemListElement: crumbs.map((crumb, i) => ({
  //     '@type': 'ListItem',
  //     position: i + 1,
  //     name: crumb.name,
  //     item: `https://watchedthis.com${crumb.href}`,
  //   })),
  // };

  // return (
  //   <script
  //     type="application/ld+json"
  //     dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
  //   />
  // );
}