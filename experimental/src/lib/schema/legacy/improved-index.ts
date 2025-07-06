import { Data } from "effect";

// SurrealDB index types
export type SurrealIndexType = "UNIQUE" | "SEARCH" | "MTREE";

// SurrealDB index definition using Data.taggedClass
export class SurrealIndexDefinition extends Data.TaggedClass("SurrealIndexDefinition")<{
  readonly name: string;
  readonly table: string;
  readonly type?: SurrealIndexType;
  readonly fields: readonly string[];
  readonly condition?: string;
  readonly description?: string;
  readonly drop?: boolean;
  readonly dimension?: number; // For MTREE indexes
  readonly distance?: "COSINE" | "EUCLIDEAN" | "MANHATTAN" | "PEARSON"; // For MTREE indexes
  readonly doc_ids_order?: number; // For SEARCH indexes
  readonly doc_lengths_order?: number; // For SEARCH indexes
  readonly postings_order?: number; // For SEARCH indexes
  readonly terms_order?: number; // For SEARCH indexes
  readonly analyzer?: string; // For SEARCH indexes
  readonly bm25?: {
    readonly k1?: number;
    readonly b?: number;
  }; // For SEARCH indexes
  readonly highlights?: boolean; // For SEARCH indexes
}> {}

// Improved SurrealIndex using Data.taggedClass
export class SurrealIndex extends Data.TaggedClass("SurrealIndex")<{
  readonly definition: SurrealIndexDefinition;
}> {
  // Static factory methods
  static create(name: string, table: string, fields: readonly string[]): SurrealIndex {
    return new SurrealIndex({
      definition: new SurrealIndexDefinition({
        name,
        table,
        fields,
      }),
    });
  }

  static unique(name: string, table: string, fields: readonly string[]): SurrealIndex {
    return new SurrealIndex({
      definition: new SurrealIndexDefinition({
        name,
        table,
        fields,
        type: "UNIQUE",
      }),
    });
  }

  static search(name: string, table: string, fields: readonly string[]): SurrealIndex {
    return new SurrealIndex({
      definition: new SurrealIndexDefinition({
        name,
        table,
        fields,
        type: "SEARCH",
      }),
    });
  }

  static mtree(name: string, table: string, field: string, dimension: number): SurrealIndex {
    return new SurrealIndex({
      definition: new SurrealIndexDefinition({
        name,
        table,
        fields: [field],
        type: "MTREE",
        dimension,
      }),
    });
  }

  // Fluent API methods - all return new instances due to immutability
  unique(): SurrealIndex {
    return new SurrealIndex({
      definition: new SurrealIndexDefinition({
        ...this.definition,
        type: "UNIQUE",
      }),
    });
  }

  search(): SurrealIndex {
    return new SurrealIndex({
      definition: new SurrealIndexDefinition({
        ...this.definition,
        type: "SEARCH",
      }),
    });
  }

  mtree(dimension: number): SurrealIndex {
    return new SurrealIndex({
      definition: new SurrealIndexDefinition({
        ...this.definition,
        type: "MTREE",
        dimension,
      }),
    });
  }

  condition(condition: string): SurrealIndex {
    return new SurrealIndex({
      definition: new SurrealIndexDefinition({
        ...this.definition,
        condition,
      }),
    });
  }

  description(desc: string): SurrealIndex {
    return new SurrealIndex({
      definition: new SurrealIndexDefinition({
        ...this.definition,
        description: desc,
      }),
    });
  }

  drop(): SurrealIndex {
    return new SurrealIndex({
      definition: new SurrealIndexDefinition({
        ...this.definition,
        drop: true,
      }),
    });
  }

  // MTREE specific methods
  distance(distance: "COSINE" | "EUCLIDEAN" | "MANHATTAN" | "PEARSON"): SurrealIndex {
    if (this.definition.type !== "MTREE") {
      throw new Error("Distance can only be set for MTREE indexes");
    }

    return new SurrealIndex({
      definition: new SurrealIndexDefinition({
        ...this.definition,
        distance,
      }),
    });
  }

  // SEARCH specific methods
  analyzer(analyzer: string): SurrealIndex {
    if (this.definition.type !== "SEARCH") {
      throw new Error("Analyzer can only be set for SEARCH indexes");
    }

    return new SurrealIndex({
      definition: new SurrealIndexDefinition({
        ...this.definition,
        analyzer,
      }),
    });
  }

  bm25(k1?: number, b?: number): SurrealIndex {
    if (this.definition.type !== "SEARCH") {
      throw new Error("BM25 can only be set for SEARCH indexes");
    }

    return new SurrealIndex({
      definition: new SurrealIndexDefinition({
        ...this.definition,
        bm25: { k1, b },
      }),
    });
  }

  highlights(enabled = true): SurrealIndex {
    if (this.definition.type !== "SEARCH") {
      throw new Error("Highlights can only be set for SEARCH indexes");
    }

    return new SurrealIndex({
      definition: new SurrealIndexDefinition({
        ...this.definition,
        highlights: enabled,
      }),
    });
  }

  docIdsOrder(order: number): SurrealIndex {
    if (this.definition.type !== "SEARCH") {
      throw new Error("Doc IDs order can only be set for SEARCH indexes");
    }

    return new SurrealIndex({
      definition: new SurrealIndexDefinition({
        ...this.definition,
        doc_ids_order: order,
      }),
    });
  }

  docLengthsOrder(order: number): SurrealIndex {
    if (this.definition.type !== "SEARCH") {
      throw new Error("Doc lengths order can only be set for SEARCH indexes");
    }

    return new SurrealIndex({
      definition: new SurrealIndexDefinition({
        ...this.definition,
        doc_lengths_order: order,
      }),
    });
  }

  postingsOrder(order: number): SurrealIndex {
    if (this.definition.type !== "SEARCH") {
      throw new Error("Postings order can only be set for SEARCH indexes");
    }

    return new SurrealIndex({
      definition: new SurrealIndexDefinition({
        ...this.definition,
        postings_order: order,
      }),
    });
  }

  termsOrder(order: number): SurrealIndex {
    if (this.definition.type !== "SEARCH") {
      throw new Error("Terms order can only be set for SEARCH indexes");
    }

    return new SurrealIndex({
      definition: new SurrealIndexDefinition({
        ...this.definition,
        terms_order: order,
      }),
    });
  }

  // Helper methods
  getName(): string {
    return this.definition.name;
  }

  getTable(): string {
    return this.definition.table;
  }

  getType(): SurrealIndexType | undefined {
    return this.definition.type;
  }

  getFields(): readonly string[] {
    return this.definition.fields;
  }

  getCondition(): string | undefined {
    return this.definition.condition;
  }

  getDescription(): string | undefined {
    return this.definition.description;
  }

  isDrop(): boolean {
    return this.definition.drop ?? false;
  }

  // Generate SurrealQL index definition
  toSurrealQL(): string {
    if (this.definition.drop) {
      return `REMOVE INDEX ${this.definition.name} ON ${this.definition.table}`;
    }

    const parts: string[] = [];

    parts.push(`DEFINE INDEX ${this.definition.name} ON ${this.definition.table}`);

    if (this.definition.type) {
      parts.push(`USING ${this.definition.type}`);
    }

    // Add fields
    const fieldsStr = this.definition.fields.join(", ");

    if (this.definition.type === "MTREE") {
      parts.push(`FIELDS ${fieldsStr} DIMENSION ${this.definition.dimension}`);

      if (this.definition.distance) {
        parts.push(`DISTANCE ${this.definition.distance}`);
      }
    } else if (this.definition.type === "SEARCH") {
      parts.push(`FIELDS ${fieldsStr}`);

      if (this.definition.analyzer) {
        parts.push(`ANALYZER ${this.definition.analyzer}`);
      }

      if (this.definition.bm25) {
        const bm25Parts = [];
        if (this.definition.bm25.k1 !== undefined) {
          bm25Parts.push(`K1 ${this.definition.bm25.k1}`);
        }
        if (this.definition.bm25.b !== undefined) {
          bm25Parts.push(`B ${this.definition.bm25.b}`);
        }
        if (bm25Parts.length > 0) {
          parts.push(`BM25 ${bm25Parts.join(" ")}`);
        }
      }

      if (this.definition.highlights) {
        parts.push("HIGHLIGHTS");
      }

      if (this.definition.doc_ids_order !== undefined) {
        parts.push(`DOC_IDS_ORDER ${this.definition.doc_ids_order}`);
      }

      if (this.definition.doc_lengths_order !== undefined) {
        parts.push(`DOC_LENGTHS_ORDER ${this.definition.doc_lengths_order}`);
      }

      if (this.definition.postings_order !== undefined) {
        parts.push(`POSTINGS_ORDER ${this.definition.postings_order}`);
      }

      if (this.definition.terms_order !== undefined) {
        parts.push(`TERMS_ORDER ${this.definition.terms_order}`);
      }
    } else {
      parts.push(`FIELDS ${fieldsStr}`);
    }

    if (this.definition.condition) {
      parts.push(`WHERE ${this.definition.condition}`);
    }

    if (this.definition.description) {
      parts.push(`COMMENT "${this.definition.description}"`);
    }

    return parts.join(" ");
  }
}
