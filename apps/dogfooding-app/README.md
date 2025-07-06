# Dogfooding App

This application demonstrates using `@necmttn/surql-schema` to build a real-world application following the progressive learning path. We'll build a **Task Management Platform** step-by-step, showcasing how users would actually adopt and use the library.

## 🎯 Application: Task Management Platform

We're building a comprehensive task management platform with:
- **User management** with teams and permissions
- **Project organization** with nested task hierarchies  
- **Real-time collaboration** features
- **Reporting and analytics** capabilities
- **Multi-tenant architecture** for organizations

## 📚 Progressive Implementation

### Step 1: Basic Schema Foundation
- Start with simple tables using Schema.Class fundamentals
- User, Project, and Task entities
- Basic field types and relationships

### Step 2: Composition Patterns  
- Introduce Schema.pipe for reusable constraints
- Email, username, slug validation patterns
- Shared business logic constraints

### Step 3: Rich Annotations
- Add comprehensive metadata and documentation
- Form generation capabilities
- API documentation from schemas

### Step 4: Advanced Patterns
- Complex validation workflows
- Schema migrations and versioning
- Advanced relationship patterns

### Step 5: Production Ready
- Complete multi-tenant architecture
- Performance optimization with strategic indexing
- Business logic enforcement via events
- Real-world deployment patterns

## 🚀 Getting Started

```bash
# Install dependencies
bun install

# Start with Step 1 - Basic foundations
bun run step:01

# Progress through each step
bun run step:02
bun run step:03
bun run step:04
bun run step:05

# Run the complete application
bun dev
```

## 🏗 Architecture Overview

```
Task Management Platform
├── Organizations (Multi-tenant root)
├── Teams (within organizations)  
├── Users (cross-team membership)
├── Projects (team-scoped)
├── Tasks (project-scoped, hierarchical)
├── Comments (task discussions)
├── Attachments (file management)
├── Time Tracking (productivity metrics)
└── Reports (analytics and insights)
```

## 📋 Learning Objectives

By following this implementation, you'll understand:

1. **Real-world adoption** - How teams would actually start using surql-schema
2. **Progressive enhancement** - Adding complexity step-by-step
3. **Migration patterns** - Evolving schemas safely in production
4. **Performance considerations** - Indexing and query optimization
5. **Business logic** - Enforcing rules through database events
6. **Developer experience** - Tooling integration and documentation

## 🔄 User Journey Simulation

This app simulates the typical journey of:

1. **Small team** starting with basic needs (Steps 1-2)
2. **Growing startup** adding business rules (Step 3)
3. **Scaling company** with complex requirements (Step 4)
4. **Enterprise platform** with full multi-tenancy (Step 5)

Each step demonstrates how surql-schema grows with your application needs.