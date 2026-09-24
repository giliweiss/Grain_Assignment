"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/conferences", label: "Conferences" },
  { href: "/plan", label: "Year Plan" },
  { href: "/floor", label: "Quick Capture" },
  { href: "/people", label: "People" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
                  : "rounded-md px-3 py-2 text-sm font-medium text-neutral-700"
              }
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
