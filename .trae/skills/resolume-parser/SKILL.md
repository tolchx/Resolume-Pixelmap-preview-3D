---
name: "resolume-parser"
description: "Rules for parsing Resolume XML/JSON files. Invoke when modifying import logic, Screen/Slice extraction, or InputRect/OutputRect handling."
---

# Resolume XML/JSON Parser

This skill provides context for parsing Resolume composition files (XML/JSON) in this project.

## Core Concepts

1. **Screens & Slices**: Resolume uses "Screens" which contain multiple "Slices". We extract the dimensions and position from these elements.
2. **InputRect & OutputRect**:
   - `InputRect`: Defines the source texture area.
   - `OutputRect`: Defines where it is placed in the final composition output.
3. **Extraction**: The logic is located in `js/app.js` and should properly extract names, dimensions, and coordinates to be transformed into 3D space (`loc3D`, `rot3D`).

## Guidelines for Updates

- When adding new fields from Resolume to parse, ensure you check both XML structure and JSON structure if the app supports both.
- Maintain the extraction of `name`, `loc3D`, `width`, `height`.
- If modifying the logic, consider the toggle between using `InputRect` vs `OutputRect` for reference size and positioning.
