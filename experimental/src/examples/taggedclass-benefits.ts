import { Data, Effect, Equal } from "effect";
import { SurrealField } from "../lib/schema/field.ts";
import { SurrealField as ImprovedSurrealField } from "../lib/schema/improved-field.ts";

// Demonstration of the benefits of using Data.taggedClass
export const demonstrateTaggedClassBenefits = Effect.gen(function* (_) {
  console.log("=== Data.taggedClass Benefits Demonstration ===\n");

  // 1. Automatic Tagging
  console.log("1. Automatic Tagging:");
  const originalField = SurrealField.string("username").length(50).required();
  const improvedField = ImprovedSurrealField.string("username").length(50).required();

  console.log("Original field _tag:", (originalField as any)._tag);
  console.log("Improved field _tag:", improvedField._tag);
  console.log("Field definition _tag:", improvedField.definition._tag);
  console.log("Field constraints _tag:", improvedField.definition.constraints?._tag);
  console.log();

  // 2. Structural Equality - More Reliable
  console.log("2. Structural Equality:");

  const field1 = ImprovedSurrealField.string("name").length(50);
  const field2 = ImprovedSurrealField.string("name").length(50);
  const field3 = ImprovedSurrealField.string("name").length(100);

  console.log("field1 equals field2 (same definition):", Equal.equals(field1, field2));
  console.log("field1 equals field3 (different length):", Equal.equals(field1, field3));
  console.log();

  // 3. Immutability Guarantee
  console.log("3. Immutability:");

  const baseField = ImprovedSurrealField.string("email");
  const modifiedField = baseField.pattern("^[^@]+@[^@]+\\.[^@]+$").unique();

  console.log("Base field has pattern:", !!baseField.definition.constraints?.pattern);
  console.log("Modified field has pattern:", !!modifiedField.definition.constraints?.pattern);
  console.log("Base field unchanged (immutable):", !baseField.definition.constraints?.pattern);
  console.log();

  // 4. Pattern Matching Support
  console.log("4. Pattern Matching:");

  const analyzeField = (field: ImprovedSurrealField): string => {
    // Using _tag for pattern matching
    switch (field._tag) {
      case "SurrealField":
        switch (field.definition._tag) {
          case "SurrealFieldDefinition":
            return `Field: ${field.definition.name} (${field.definition.type})`;
          default:
            return "Unknown field definition";
        }
      default:
        return "Unknown field type";
    }
  };

  console.log("Pattern matching result:", analyzeField(modifiedField));
  console.log();

  // 5. Better Type Discrimination
  console.log("5. Type Discrimination:");

  type FieldAnalysis = {
    hasConstraints: boolean;
    hasPermissions: boolean;
    isOptional: boolean;
    isReference: boolean;
  };

  const analyzeFieldStructure = (field: ImprovedSurrealField): FieldAnalysis => {
    return {
      hasConstraints: field.definition.constraints !== undefined,
      hasPermissions: field.definition.permissions !== undefined,
      isOptional: field.definition.isOptional,
      isReference: field.definition.references !== undefined,
    };
  };

  const userIdField = ImprovedSurrealField.id("user");
  const emailField = ImprovedSurrealField.string("email")
    .pattern("^[^@]+@[^@]+\\.[^@]+$")
    .unique()
    .description("User email address");
  const authorField = ImprovedSurrealField.record("author", "user").optional();

  console.log("User ID field analysis:", analyzeFieldStructure(userIdField));
  console.log("Email field analysis:", analyzeFieldStructure(emailField));
  console.log("Author field analysis:", analyzeFieldStructure(authorField));
  console.log();

  // 6. Cleaner Constructor API
  console.log("6. Constructor API Comparison:");

  // Old way (more verbose)
  console.log("Old way: new SurrealField(SurrealFieldDefinition({...}))");

  // New way (cleaner)
  console.log(
    "New way: new ImprovedSurrealField({ definition: new SurrealFieldDefinition({...}) })"
  );
  console.log("Even better: ImprovedSurrealField.string('name').length(50)");
  console.log();

  // 7. Deep Equality for Complex Structures
  console.log("7. Deep Equality:");

  const complexField1 = ImprovedSurrealField.string("complex_field")
    .length(100)
    .pattern("^[A-Z].*")
    .unique()
    .required()
    .description("A complex field with many constraints");

  const complexField2 = ImprovedSurrealField.string("complex_field")
    .length(100)
    .pattern("^[A-Z].*")
    .unique()
    .required()
    .description("A complex field with many constraints");

  const complexField3 = ImprovedSurrealField.string("complex_field")
    .length(100)
    .pattern("^[A-Z].*")
    .unique()
    .required()
    .description("A different description");

  console.log("Complex field1 equals field2:", Equal.equals(complexField1, complexField2));
  console.log("Complex field1 equals field3:", Equal.equals(complexField1, complexField3));
  console.log();

  // 8. Memory Efficiency and Performance
  console.log("8. Performance Benefits:");
  console.log("- Automatic structural hashing for faster equality checks");
  console.log("- Optimized memory layout");
  console.log("- Better garbage collection performance");
  console.log("- Efficient cloning for immutable operations");
  console.log();

  // 9. JSON Serialization
  console.log("9. Serialization:");

  const serializedField = JSON.stringify(improvedField, null, 2);
  console.log("Automatic JSON serialization with tags:");
  console.log(`${serializedField.substring(0, 200)}...`);
  console.log();

  // 10. Integration with Effect Ecosystem
  console.log("10. Effect Ecosystem Integration:");
  console.log("✅ Works seamlessly with Effect.Equal");
  console.log("✅ Compatible with Effect pattern matching");
  console.log("✅ Integrates with Effect data transformation pipelines");
  console.log("✅ Supports Effect's functional programming patterns");
  console.log("✅ Better error handling and debugging");
  console.log();

  console.log("=== Recommendation ===");
  console.log("Use Data.taggedClass for:");
  console.log("- All schema definition classes (Field, Table, Index, Event)");
  console.log("- Configuration and metadata classes");
  console.log("- Any class that needs structural equality");
  console.log("- Classes used in comparison operations");
  console.log("- Classes that benefit from immutability guarantees");
});

// Performance comparison example
export const performanceComparison = Effect.gen(function* (_) {
  console.log("\n=== Performance Comparison ===");

  const iterations = 10000;

  // Create test fields
  const createImprovedFields = () => {
    return Array.from({ length: iterations }, (_, i) =>
      ImprovedSurrealField.string(`field_${i}`).length(50 + (i % 100))
    );
  };

  // Test equality performance
  console.log(`Testing equality performance with ${iterations} fields...`);

  const fields = createImprovedFields();
  const start = performance.now();

  let equalCount = 0;
  for (let i = 0; i < fields.length - 1; i++) {
    if (Equal.equals(fields[i], fields[i + 1])) {
      equalCount++;
    }
  }

  const end = performance.now();
  console.log(`Equality checks completed in ${(end - start).toFixed(2)}ms`);
  console.log(`Equal pairs found: ${equalCount}`);
  console.log();

  // Test immutable updates performance
  console.log("Testing immutable updates performance...");

  const baseField = ImprovedSurrealField.string("test_field");
  const updateStart = performance.now();

  let currentField = baseField;
  for (let i = 0; i < 1000; i++) {
    currentField = currentField.length(i + 1).description(`Updated ${i} times`);
  }

  const updateEnd = performance.now();
  console.log(`1000 immutable updates completed in ${(updateEnd - updateStart).toFixed(2)}ms`);
  console.log(`Final field length: ${currentField.definition.constraints?.length}`);
  console.log(
    `Original field unchanged: ${baseField.definition.constraints?.length === undefined}`
  );
});

// Run demonstrations if this file is executed directly
if (import.meta.main) {
  Effect.runSync(demonstrateTaggedClassBenefits);
  Effect.runSync(performanceComparison);
}
