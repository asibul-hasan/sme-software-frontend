# AI Developer Guide - SME Software Frontend

This document contains mandatory rules and patterns for AI assistants working on this repository. **Always read this file before starting any task.**

## General Rules
1.  **Styling**: Use **Bootstrap 5** classes for layout and common UI components (modals, grids, forms). Avoid custom SCSS unless Bootstrap is insufficient.
2.  **Component Architecture**: Follow the established pattern for the `DataTableComponent`.
3.  **UI Consistency**: Use existing theme variables from `_themes.scss` for colors and spacing.

## Data Table Patterns
A new action icon has been added to the table rows. Clicking this icon captures the row's data and triggers the display of a detailed view modal.
- **Icon**: Material `visibility` (Eye).
- **Tooltip**: "View Details".
- **Interactions**: Prevents row selection/activation while clicking.

1.  **Z-Index Ladder**:
    *   Table Rows: `0`
    *   Fixed/Pinned Columns: `5` (with opaque background)
    *   Sticky Header/Footer: `10`
    *   Intersection Corners: `15-20`
    *   Modals/Overlays: `99999`
2.  **Action Icons**: Use standard names like `visibility` (eye), `delete_outline`, `content_copy`.
3.  **Backgrounds**: Always enforce opaque backgrounds (`#ffffff` or theme-based) for sticky/pinned elements to prevent content bleeding.

### 2. Premium View Modal (SME Standard)
A responsive, full-screen modal overlay has been added to the component, following the specific "SME Layout Standard".
- **Architecture**: Bootstrap 5 Modal with a blurred backdrop.
- **Grid Layout**: 3-column grid organization.
- **Design Elements**:
    - **Labels**: positioned **above** value containers for improved readability.
    - **Value Containers**: styled as clean, white boxes with light borders, mimicking read-only form fields.
    - **Icons**: Optional field-specific icons (e.g., building for records) integrated into the value view.
    - **Required Indicators**: Red asterisks (*) automatically shown for mandatory database fields.

## Modal Implementation
- Use standard Bootstrap modal markup:
    ```html
    <div class="modal fade show" style="display: block;">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">...</div>
          <div class="modal-body">...</div>
        </div>
      </div>
    </div>
    ```
- Use the Bootstrap Grid (`row`, `col-md-*`) for layout inside modals.

## Preferred Layout for "Details" Modals
*   **Grid**: 3-column layout using `.row.g-4` and `.col-md-4`.
*   **Labels**: Place **above** the value container. Use class `.etbl-view-label` (13px, weight 600, color #64748b).
*   **Value Containers**: White background, light border (#e2e8f0), 6px radius, 42px height.
*   **Required Fields**: Show a red `*` next to the label if `required: true`.
*   **Icons**: Use optional `col.icon` (material icons) inside the value container on the left.
