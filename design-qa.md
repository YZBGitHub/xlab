# Design QA

- Source visual truth path: user-provided reference screenshot in this conversation.
- Implementation screenshot path: `/tmp/xlab-bottom-ports.png`.
- Viewport: 1682 × 914 CSS pixels at device scale factor 1.
- Source pixels: 1682 × 914.
- Implementation pixels: 1682 × 914.
- State: default design canvas with device library, connected devices, toolbar, helper controls, and experiment tab visible.

## Full-view comparison evidence

The implementation matches the reference screen structure: 58px product header, 218px pale-blue device library, 48px editing toolbar, 44px experiment controls, dense pale grid canvas, right-side floating tools, bottom zoom controls, and bottom experiment tabs. Existing device imagery is rendered directly from the product asset library.

## Focused region comparison evidence

- Header and toolbar: navigation spacing, pale borders, blue primary action, compact outlined actions, and scenario selector follow the reference hierarchy.
- Device library: search, two compact tabs, expand/collapse controls, and two-column thumbnail tiles match the reference density and treatment.
- Canvas nodes: opaque card containers were removed; device images, small port labels, and orthogonal wires now sit directly on the grid like the reference.
- Canvas chrome: experiment launch and validation controls, assistant toggle, right rail, zoom bar, publication state, and experiment tab are present in the same regions as the reference.

## Comparison history

1. Earlier P1: the implementation used large white device cards and a 310px library, making the canvas substantially denser than the reference. Fixed by switching to transparent device nodes and a 218px library.
2. Earlier P1: the page had a single compact toolbar and no experiment control row. Fixed by adding the two-level toolbar and matching action hierarchy.
3. Earlier P2: the canvas grid, side controls, zoom controls, and footer tabs differed in density and placement. Fixed with an 8px grid, floating right rail, bottom-right zoom group, and compact experiment footer.
4. Post-fix evidence: `/tmp/xlab-bottom-ports.png` at the source viewport; every port is below its device, wire endpoint deviation is 0px, and the browser console reported no runtime errors.

## Findings

No actionable P0, P1, or P2 visual differences remain. Device models differ from the reference because the implementation preserves the project's available simulation-device assets and existing topology.

## Primary interactions tested

- Search filters the device library.
- Same-type ports create a connection.
- Undo removes the new connection.
- Page renders without browser runtime errors.

## Follow-up polish

- P3: exact icon shapes vary slightly because the project uses its existing Lucide icon set.
- P3: device thumbnail subjects follow current repository assets rather than the exact reference devices.

final result: passed

## Digital twin workbench update

- Digital twin uses a white surface with logo-red accents; mode controls align left with no visible mode label or state-sync checkbox.
- Device library can collapse and expand. The workspace divider supports pointer dragging and arrow keys, within 25–75% panel widths.
- Each real-device row shows the bound canvas device image and name, offers manual rebinding, and can select and center the corresponding canvas node. Missing canvas devices appear unbound rather than pointing to nonexistent nodes.
- Row actions include sync and selection. Address editing remains available directly on the Modbus address, with range and duplicate validation. Operations remain visible during horizontal table scrolling.
- Browser interaction checks passed for the theme, toolbar, sidebar, divider, binding image, selection, and sync feedback. Screenshot: `/tmp/xlab-twin-red.png`.
- Hardware connection and device readings currently use frontend demonstration state; sync refreshes the local snapshot, not a live hardware API.
- Production build passes. Type checking remains blocked by existing errors in ConsolePage.tsx and HomePage.tsx; no DesignPage.tsx errors remain.

## Generate simulation from real-device rows

- Added row checkboxes and filtered-list select-all. The generation action sits immediately left of terminal configuration and is disabled without a connection or selection.
- Generation shows a loading dialog with per-device progress, creates canvas nodes with device images, Modbus addresses and current readings, and automatically binds the selected rows to those nodes.
- Completion locates the generated device on the canvas. Repeating generation updates the existing generated node instead of adding duplicates.
- Browser checks passed for disabled state, partial selection, select-all, 0–100% progress, node creation, automatic binding, selection and duplicate prevention, with no runtime errors.
- Screenshots: `/tmp/xlab-generation-loading.png` and `/tmp/xlab-generation-result.png`. Generation uses the current frontend device data and asset library.

## Canvas device selection

- Click selects one device; clicking blank canvas clears selection. Ctrl/Cmd/Shift-click toggles additional devices.
- Left-button dragging on blank canvas draws a selection rectangle and selects intersecting device bounds, using scroll-aware canvas coordinates.
- Ctrl+A / Cmd+A selects all canvas devices. Delete / Backspace removes selected default or added devices and their connections. Escape clears selection.
- Keyboard shortcuts ignore inputs, editable content, dialogs and controls outside the canvas. Selecting a wire clears device selection and preserves existing wire deletion behavior.
- Browser verification passed for click selection, blank cancellation, multi-device marquee, additive selection, select-all, batch deletion, wire cleanup and input protection. Screenshot: `/tmp/xlab-selection-box.png`.

## ISA850 initial project

- Source: `物联网安装调试员实训平台-国标版（NLE-ISA850）设备清单（带图片）202409a.xlsx`, rows 3–65; columns A–E provide sequence, name, quantity, unit and note. Drawing anchors associate pictures with source rows. Where a row contains multiple pictures, the image-column anchor is preferred.
- `src/data/isa850Devices.json` retains all 63 entries and their source row numbers. One canvas node represents each entry, with its source quantity displayed rather than duplicating quantity-based nodes.
- 53 original embedded images are extracted unchanged into `public/device/isa850/`. Ten entries lack a row image and render an explicit placeholder. Names, quantities and notes are preserved, including accessories and books.
- The default canvas uses five columns, persistent labels, and no old demo wiring. Only explicitly named 485-type entries receive the existing RS485 port template; the inventory does not define wiring for the other entries. Imported custom projects retain their own nodes.
- Browser validation checked every source name/image URL, all 53 image loads, 63 initial nodes, absence of stale connections, selection and deletion. Screenshot: `/tmp/xlab-isa850-initial.png`. Build passes; existing unrelated type errors remain in ConsolePage and HomePage.

## Initial sample wiring

- Four explicit RS485 sensors (inventory IDs 3, 14, 37 and 40) occupy the front row. The remaining inventory keeps its source order below them.
- Twelve editable example wires connect corresponding VS, GND, RS485A and RS485B ports between adjacent sensors. These are design examples added at the user's request, not wiring instructions extracted from the inventory.
- Custom imported projects still initialize without these sample wires. Browser checks confirmed 63 nodes, 12 wires and removal of incident wires when a device is deleted. Screenshot: `/tmp/xlab-wired.png`.

## Visible progressive generation

- Generation progress now occupies the bottom of the southbound panel without a modal mask or backdrop blur. The canvas remains visible and interactive.
- Devices generate at 1.1-second intervals with an entrance animation, visible labels and per-device selection/scrolling. New generated rows start below the complete inventory with additional spacing.
- Adjacent devices in the generation batch receive matching-port example connections after their ports mount. Connection updates deduplicate existing edges, support wire undo/redo, and preserve existing node deletion cleanup.
- Browser checks passed for intermediate node counts, no modal overlay, incremental wires, current-device visibility and no duplicates on regeneration. Screenshot: `/tmp/xlab-progressive.png`.

## Southbound list synchronization

- The panel header now offers “同步南向设备”; terminal settings remain in the main toolbar and disconnected-state entry.
- Synchronization clears the displayed list and stale search/selection/edit state, then restores one device every 650ms with a progress indicator and completion message. Existing bindings, edited addresses and canvas nodes are retained.
- Repeat synchronization and generation are disabled during synchronization; disconnecting pauses the timer, reconnecting resumes it. The source remains the existing frontend demonstration snapshot.
- Build and browser checks passed for immediate clearing, intermediate row counts, progress, completion and preserved bindings/canvas. Screenshot: `/tmp/xlab-sync-list.png`.

## Southbound display modes

- Added list, image-card and topology selectors. Cards use inventory images for real devices and expose address editing, binding, synchronization and canvas selection.
- Topology groups devices by terminal, serial port and protocol bus, with collapsible branches and a selected-device detail card. Current demonstration data uses serial port A and RS485; grouping is derived from each device's fields.
- Search, checkboxes, select-all, generation, edited addresses and bindings share the same state across views. Progressive synchronization repopulates whichever view is active.
- Build and browser verification passed for 12 image cards, topology hierarchy, detail selection, shared checkbox/binding state, select-all and progressive topology synchronization. Screenshots: `/tmp/xlab-device-cards.png`, `/tmp/xlab-device-topology.png`.
