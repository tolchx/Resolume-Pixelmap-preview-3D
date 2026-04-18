---
name: "csv-unreal-exporter"
description: "Formats CSV export mapping for Unreal Engine. Invoke when modifying export logic, adding new fields to the CSV, or adjusting coordinate mappings."
---

# CSV Unreal Exporter

This skill handles the logic and conventions for exporting the extracted screen data to a CSV file compatible with Unreal Engine.

## Coordinate Mapping

- **Resolume to Unreal Mapping**: Unreal Engine uses a different coordinate system (Z-up, Left-handed).
- The mapping applied during export is:
  - `Unreal X` = `Resolume X`
  - `Unreal Y` = `Resolume Z` (Depth)
  - `Unreal Z` = `Resolume Y` (Height)
- This mapping is expressed as `Loc3D = (x, z, y)`.

## Rotation

- Include `Rot3D` logic in exports to ensure orientation matches exactly in the game engine.
- Ensure angles are in the correct format (degrees vs radians) as expected by the target Unreal project configuration.

## File Format

- The exported CSV must maintain headers that the Unreal data table can parse directly.
- Ensure any added columns match the exact naming convention required by the user's Unreal struct.
