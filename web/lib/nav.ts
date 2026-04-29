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
    label: "Calculate",
    items: [
      { href: "/name", label: "Name number" },
      { href: "/phone", label: "Phone numbers" },
    ],
  },
  {
    label: "Learn",
    items: [
      { href: "/learn/overview", label: "Overview", soon: true },
      { href: "/learn/numbers", label: "Mulank & Bhagyank", soon: true },
      { href: "/learn/compound-names", label: "Compound names", soon: true },
    ],
  },
  {
    label: "Timing",
    items: [
      { href: "/timing/days", label: "Days of the week", soon: true },
      { href: "/timing/dates", label: "Dates of the month", soon: true },
    ],
  },
  {
    label: "Palette",
    items: [{ href: "/colors", label: "Colors", soon: true }],
  },
  {
    label: "Commerce",
    items: [
      { href: "/commerce/pricing", label: "Pricing", soon: true },
      { href: "/commerce/negotiation", label: "Negotiation", soon: true },
    ],
  },
  {
    label: "Vehicles",
    items: [{ href: "/vehicles", label: "Vehicle numbers", soon: true }],
  },
];
