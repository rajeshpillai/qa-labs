# Kata 36: Notifications and Toasts

## What You Will Learn

- How to test auto-dismissing toast notifications (appear then vanish)
- How to test persistent banners that stay until manually dismissed
- How to handle modal dialogs with confirm/cancel actions
- How to test snackbar notifications with action buttons (Undo)
- How to verify notification badge counts
- How to interact with slide-in notification drawers
- How to verify priority-based stacking order of notifications

## Prerequisites

- Completed Katas 01-35
- Understanding of CSS animations, timers, and DOM assertions

## Concepts Explained

### Notification Types

```
1. Toast       — brief auto-dismiss message (3s), stacks bottom-right
2. Banner      — persistent bar at top, manual dismiss only
3. Modal       — blocking dialog, requires user action (confirm/cancel)
4. Snackbar    — bottom-center bar with optional action (e.g., Undo)
5. Badge       — counter on an icon showing unread notification count
6. Drawer      — slide-in panel listing all notifications
```

### Testing Auto-Dismiss Elements

```typescript
// PLAYWRIGHT
// Toast appears, then auto-dismisses after 3 seconds.
// Use toBeVisible() to verify it appeared, then toBeHidden()
// with a timeout to wait for auto-dismiss.
await expect(toast).toBeVisible();
await expect(toast).toBeHidden({ timeout: 5000 });

// CYPRESS
// Use should('be.visible') then should('not.exist') with
// sufficient timeout for auto-dismiss.
cy.get('[data-testid="toast-info"]').should('be.visible');
cy.get('[data-testid="toast-info"]', { timeout: 5000 }).should('not.exist');
```

### Priority Stacking

```
When multiple notifications fire, priority determines visual order:
  - Error (highest)  — appears on top
  - Warning          — appears in middle
  - Info (lowest)    — appears at bottom

The toast container uses CSS flex-direction: column-reverse so the
last appended element appears visually on top.
```

## Playground Overview

A notification testing playground with:

- **Toast buttons** — Trigger info, success, warning, error toasts (auto-dismiss 3s)
- **Banner** — Persistent info bar with dismiss button
- **Modal dialog** — Blocking confirmation with Cancel/Confirm
- **Snackbar** — "Item deleted" bar with Undo action
- **Badge** — Bell icon with unread count
- **Drawer** — Slide-in panel listing all notifications
- **Multi-toast** — Fire 3 toasts simultaneously
- **Priority toasts** — Fire info + warning + error to test stacking order

## Exercises

1. **Trigger toast, verify appears then dismisses** — Show a toast and wait for auto-dismiss
2. **Verify banner persists** — Show banner, verify it stays visible
3. **Dismiss notification** — Show banner, click dismiss, verify it's gone
4. **Verify badge count** — Trigger notifications and check the badge number
5. **Open notification drawer** — Click bell, verify drawer slides in with items
6. **Click snackbar action (undo)** — Show snackbar, click Undo, verify status
7. **Verify priority stacking order** — Fire priority toasts, verify error is on top
8. **Multiple toasts stacking** — Fire 3 toasts and verify all are visible simultaneously
