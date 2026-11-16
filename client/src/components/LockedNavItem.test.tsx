import "../test-dom";
import React from "react";
import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { SidebarProvider } from "@/components/ui/sidebar";
import { activateLockedNav, lockedNavLabel } from "@/lib/locked-nav";
import { LockedNavItem } from "./LockedNavItem";

const sentence = lockedNavLabel("Dashboard");

function Mark({ className }: { className?: string; "aria-hidden"?: boolean | "true" }) {
  return <svg className={className} />;
}

test("activating a locked item opens the join dialog, and Escape returns focus without opening the route", async () => {
  const { hook, history } = memoryLocation({ path: "/communities", record: true });
  try {
    render(
      <Router hook={hook}>
        <SidebarProvider>
          <LockedNavItem
            title="Dashboard"
            label={sentence}
            isCollapsed={false}
            icon={Mark}
            testId="link-dashboard"
            onActivate={() => {
              const activated = activateLockedNav({
                title: "Dashboard",
                url: "/dashboard",
                held: true,
                ecosystemId: "eco-1",
              });
              assert.equal(activated.routeStaysClosed, true);
              return activated.note;
            }}
          />
        </SidebarProvider>
      </Router>,
    );

    const button = screen.getByRole("button", { name: sentence });
    assert.equal(button.getAttribute("title"), null);
    assert.match(button.className, /aria-disabled:pointer-events-auto/);
    assert.equal(button.className.includes("aria-disabled:pointer-events-none"), false);
    button.focus();

    await userEvent.click(button);

    const dialog = screen.getByRole("dialog", { name: sentence });
    assert.equal(dialog.getAttribute("role"), "dialog");
    const link = screen.getByRole("link", { name: "Finish joining" });
    assert.equal(link.getAttribute("href"), "/ethos/eco-1#what-to-do-next");
    assert.equal(document.querySelector('a[href="/dashboard"]'), null);
    assert.deepEqual(history, ["/communities"]);

    await userEvent.keyboard("{Escape}");

    await waitFor(() => {
      assert.equal(screen.queryByRole("dialog"), null);
      assert.equal(document.activeElement, button);
    });
    assert.deepEqual(history, ["/communities"]);
  } finally {
    cleanup();
  }
});
