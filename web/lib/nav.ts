export type NavItem = {
  href: string;
  label: string;
  soon?: boolean;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Learn",
    items: [
      { href: "/learn/overview", label: "Overview", soon: true },
      { href: "/learn/digits", label: "Digits", soon: true },
      { href: "/learn/case-studies", label: "Case studies", soon: true },
    ],
  },
  {
    label: "Calculate",
    items: [
      { href: "/name", label: "Name" },
      { href: "/phone", label: "Phone" },
      { href: "/vehicles", label: "Vehicle plate", soon: true },
      { href: "/pricing", label: "Pricing", soon: true },
      { href: "/colors", label: "Colors", soon: true },
      { href: "/timing", label: "Timing", soon: true },
    ],
  },
];
