import { Link } from 'react-router-dom';

const columns = [
  {
    title: 'NETWORKK Platform',
    links: [
      { label: 'networkk.online', to: '/' },
      { label: 'Platform Status', to: '/platform-status' },
      { label: 'Accessibility', to: '/accessibility' },
      { label: 'Download App', to: '/download' },
    ],
  },
  {
    title: 'NETWORKK Corp',
    links: [
      { label: 'About Us', to: '/about' },
      { label: 'Careers', to: '/careers' },
      { label: 'Newsroom', to: '/newsroom' },
      { label: 'Investors', to: '/investors' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', to: '/help' },
      { label: 'Using NETWORKK', to: '/using-networkk' },
      { label: 'Manage Account', to: '/manage-account' },
      { label: 'Terms & Policies', to: '/terms' },
      { label: 'Contact Us', to: '/contact' },
    ],
  },
  {
    title: 'Developer Resources',
    links: [
      { label: 'Developer Home', to: '/developers' },
      { label: 'Documentation', to: '/docs' },
      { label: 'Engineering Blog', to: '/engineering-blog' },
    ],
  },
  {
    title: 'Business Resources',
    links: [
      { label: 'Advertising', to: '/advertising' },
      { label: 'NETWORKK for Business', to: '/business' },
      { label: 'Resources & Guides', to: '/resources' },
    ],
  },
];

const SiteFooter = () => (
  <footer className="mt-16 bg-[#050505] border-t border-white/5">
    <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
      {columns.map(col => (
        <div key={col.title}>
          <h4 className="text-[#00e676] text-xs font-bold tracking-wider uppercase mb-4">{col.title}</h4>
          <ul className="space-y-2">
            {col.links.map(l => (
              <li key={l.to + l.label}>
                <Link to={l.to} className="text-white/50 hover:text-white text-sm transition">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
    <div className="border-t border-white/5 py-6 text-center text-white/30 text-xs">
      © {new Date().getFullYear()} Network FZ-LLC. All rights reserved.
    </div>
  </footer>
);

export default SiteFooter;
