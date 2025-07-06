export declare const TEST_MIGRATIONS_DIR = "./test-migrations";
export declare const TEST_GENERATED_DIR = "./test-generated";
export declare function expectSurrealQLContains(sql: string, ...patterns: string[]): void;
export declare function expectSurrealQLNotContains(sql: string, ...patterns: string[]): void;
export declare function createTestSchema(): {
    name: string;
    version: string;
    description: string;
};
export declare function createTestTable(name?: string): {
    name: string;
    description: string;
};
export declare function createTestField(name?: string, type?: string): {
    name: string;
    type: string;
    description: string;
};
//# sourceMappingURL=setup.d.ts.map