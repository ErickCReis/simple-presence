import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "Simple Presence",
    },
    githubUrl: "https://github.com/simple-presence/simple-presence",
    links: [
      {
        text: "Dashboard",
        url: "/dashboard",
      },
    ],
  };
}
