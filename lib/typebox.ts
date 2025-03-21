import { Type, type Static, type TSchema, type TObject } from "@sinclair/typebox";
import type { RecordId } from "surrealdb";

/**
 * Helper types for field selection
 */
type SelectableField<T extends TSchema> = {
  select: T;
  alias?: string;
};

/**
 * Get all properties from a TypeBox object schema
 */
type ObjectProperties<T extends TObject> = T['properties'];

/**
 * Converts a TypeBox schema into a partial schema for update operations
 * Makes all fields optional
 */
export function createUpdateType<T extends TObject>(schema: T): TObject {
  const properties = { ...schema.properties };

  // Create a new object with all properties as optional
  const updateProperties: Record<string, TSchema> = {};

  for (const [key, value] of Object.entries(properties)) {
    // Skip the id field, which shouldn't be updated
    if (key === 'id') continue;

    // Make the field optional
    updateProperties[key] = Type.Optional(value);
  }

  return Type.Object(updateProperties, {
    $id: `${schema.$id}_Update`,
    description: `Update type for ${schema.$id}`
  });
}

/**
 * Converts a TypeBox schema into an insert schema
 * Removes auto-generated fields like id
 * Makes fields with default values optional
 */
export function createInsertType<T extends TObject>(schema: T): TObject {
  const properties = { ...schema.properties };

  // Create a new object without id and other auto-generated fields
  const insertProperties: Record<string, TSchema> = {};

  for (const [key, value] of Object.entries(properties)) {
    // Skip the id field for insert
    if (key === 'id') continue;

    // Check if the field has a default value and make it optional if it does
    if (value.default !== undefined) {
      insertProperties[key] = Type.Optional(value);
    } else {
      insertProperties[key] = value;
    }
  }

  return Type.Object(insertProperties, {
    $id: `${schema.$id}_Insert`,
    description: `Insert type for ${schema.$id}`
  });
}

/**
 * Creates a schema for partial selection of fields
 * Fields with default values are made optional
 */
export function createSelectType<T extends TObject>(schema: T): TObject {
  const properties = schema.properties;
  const selectProperties: Record<string, TSchema> = {};

  // Create a new object with all properties as optional boolean flags
  for (const [key, value] of Object.entries(properties)) {
    selectProperties[key] = Type.Optional(Type.Boolean());
  }

  return Type.Object(selectProperties, {
    $id: `${schema.$id}_Select`,
    description: `Selection type for ${schema.$id}`
  });
}

/**
 * Helper to create a type for filter conditions
 */
export function createFilterType<T extends TObject>(schema: T): TObject {
  const properties = schema.properties;
  const filterProperties: Record<string, TSchema> = {};

  // For each field, create condition operators
  for (const [key, value] of Object.entries(properties)) {
    // Basic filter object with equals, not equals, etc.
    let filterType: TSchema;

    if (Type.Number().type === value.type || Type.Integer().type === value.type) {
      // Number filter conditions
      filterType = Type.Optional(Type.Union([
        value,
        Type.Object({
          eq: Type.Optional(value),
          ne: Type.Optional(value),
          gt: Type.Optional(value),
          gte: Type.Optional(value),
          lt: Type.Optional(value),
          lte: Type.Optional(value),
          in: Type.Optional(Type.Array(value)),
          nin: Type.Optional(Type.Array(value))
        })
      ]));
    } else if (Type.String().type === value.type) {
      // String filter conditions
      filterType = Type.Optional(Type.Union([
        value,
        Type.Object({
          eq: Type.Optional(value),
          ne: Type.Optional(value),
          contains: Type.Optional(value),
          startsWith: Type.Optional(value),
          endsWith: Type.Optional(value),
          in: Type.Optional(Type.Array(value)),
          nin: Type.Optional(Type.Array(value))
        })
      ]));
    } else if (Type.Boolean().type === value.type) {
      // Boolean filter is simpler
      filterType = Type.Optional(Type.Union([
        value,
        Type.Object({
          eq: Type.Optional(value),
          ne: Type.Optional(value)
        })
      ]));
    } else if (Type.Date().type === value.type) {
      // Date filter conditions
      filterType = Type.Optional(Type.Union([
        value,
        Type.Object({
          eq: Type.Optional(value),
          ne: Type.Optional(value),
          gt: Type.Optional(value),
          gte: Type.Optional(value),
          lt: Type.Optional(value),
          lte: Type.Optional(value)
        })
      ]));
    } else {
      // Default filter - just equals or in array
      filterType = Type.Optional(Type.Union([
        value,
        Type.Object({
          eq: Type.Optional(value),
          ne: Type.Optional(value),
          in: Type.Optional(Type.Array(value)),
          nin: Type.Optional(Type.Array(value))
        })
      ]));
    }

    filterProperties[key] = filterType;
  }

  return Type.Object(filterProperties, {
    $id: `${schema.$id}_Filter`,
    description: `Filter type for ${schema.$id}`
  });
}

/**
 * Register helper types for a schema
 * This creates and exports the Select, Insert, and Update types for a given schema
 */
export function registerHelperTypes<T extends TObject>(schema: T, exportTypes = true): {
  Select: TObject;
  Insert: TObject;
  Update: TObject;
  Filter: TObject;
} {
  const Select = createSelectType(schema);
  const Insert = createInsertType(schema);
  const Update = createUpdateType(schema);
  const Filter = createFilterType(schema);

  return { Select, Insert, Update, Filter };
} 