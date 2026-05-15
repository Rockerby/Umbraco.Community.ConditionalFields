# Conditional Fields - Implementation Guide

## Overview

This document explains how conditional field configuration data is stored and managed in the ConditionalProperties package for Umbraco.

## Storage Strategy

The conditional rules configuration is stored using **Umbraco's built-in `umbracoKeyValue` table**. This is the recommended approach for storing custom metadata that doesn't fit into the core database schema.

### Why KeyValue Table?

1. **No Schema Modifications**: Doesn't require custom database tables or migrations
2. **Umbraco Standard**: Uses the same pattern Umbraco uses internally for storing configuration
3. **Version Safe**: Won't break during Umbraco upgrades
4. **Simple API**: Built-in repository with clean CRUD operations
5. **Flexible**: Can store JSON-serialized complex objects

### Alternative Approaches (Not Recommended)

#### 1. Extending PropertyType Table
**Why Not**: The PropertyType database schema is managed by Umbraco core. Adding custom columns would require:
- Custom database migrations
- Risk of conflicts during Umbraco upgrades
- Potential breaking changes when Umbraco modifies the schema

#### 2. Custom Database Table
**Why Not**: Adds unnecessary complexity:
- Requires custom migrations
- More maintenance overhead
- The KeyValue table already provides this functionality

#### 3. Modifying UmbPropertyTypeScaffoldModel
**Why Not**: This is a client-side TypeScript model that doesn't persist to the database. Changes would be lost on page refresh.

## Architecture

### Storage Key Format

Configuration is stored with keys in the format:
```
ConditionalProperties.PropertyType.{PropertyTypeGuid}
```

For example:
```
ConditionalProperties.PropertyType.d1f8e7e6-1234-5678-9abc-def012345678
```

### Data Structure

The configuration is stored as JSON in the following structure:

```json
{
  "isConditional": true,
  "rules": [
    {
      "id": "rule-guid-1",
      "fieldAlias": "someFieldAlias",
      "operator": "Equals",
      "value": "someValue",
      "logicalOperator": null
    },
    {
      "id": "rule-guid-2",
      "fieldAlias": "anotherField",
      "operator": "Contains",
      "value": "text",
      "logicalOperator": "And"
    }
  ]
}
```

## Server-Side Implementation

### 1. Models (`Models/`)

#### ConditionalRule.cs
Represents a single conditional rule with:
- `Id`: Unique identifier
- `FieldAlias`: The field to evaluate
- `Operator`: Comparison operator (Equals, Contains, etc.)
- `Value`: The value to compare against
- `LogicalOperator`: How to combine with the next rule (AND/OR)

#### PropertyConditionalConfiguration.cs
Container for property-level configuration:
- `IsConditional`: Whether conditionals are enabled
- `Rules`: List of conditional rules

### 2. Service Layer (`Services/`)

#### IConditionalPropertiesConfigurationService
Interface defining operations:
- `GetConfigurationAsync(Guid propertyTypeKey)`: Retrieve configuration
- `SaveConfigurationAsync(Guid propertyTypeKey, PropertyConditionalConfiguration)`: Save configuration
- `DeleteConfigurationAsync(Guid propertyTypeKey)`: Remove configuration
- `GetAllConfigurationsAsync()`: Get all configurations (useful for rendering)

#### ConditionalPropertiesConfigurationService
Implementation using `IKeyValueRepository`:

```csharp
// Example usage
var config = await _configurationService.GetConfigurationAsync(propertyTypeGuid);
if (config?.IsConditional == true)
{
    // Apply conditional logic based on rules
}
```

**Key Implementation Details**:
- Uses `ICoreScopeProvider` for database transactions
- Serializes/deserializes using `System.Text.Json`
- Includes comprehensive error logging
- Thread-safe with proper scope management

### 3. API Controller (`Controllers/`)

#### ConditionalPropertiesConfigurationApiController
REST API endpoints:
- `GET /umbraco/conditionalfields/api/v1/conditionalfieldsconfiguration/{propertyTypeKey}`
- `POST /umbraco/conditionalfields/api/v1/conditionalfieldsconfiguration/{propertyTypeKey}`
- `DELETE /umbraco/conditionalfields/api/v1/conditionalfieldsconfiguration/{propertyTypeKey}`
- `GET /umbraco/conditionalfields/api/v1/conditionalfieldsconfiguration/all`

### 4. Dependency Injection (`Composers/`)

The service is registered as a singleton in `ConditionalPropertiesComposer.cs`:

```csharp
builder.Services.AddSingleton<IConditionalPropertiesConfigurationService, ConditionalPropertiesConfigurationService>();
```

## Client-Side Implementation

### TypeScript Integration

The property workspace view (`property-workspace-view-settings.element.ts`) integrates with the API:

#### Load Configuration
```typescript
async #loadConfiguration() {
    if (!this._currentPropertyKey) return;

    const response = await fetch(`/umbraco/conditionalfields/api/v1/conditionalfieldsconfiguration/${this._currentPropertyKey}`);
    if (response.ok) {
        const configuration = await response.json();
        this._isConditional = configuration.isConditional ?? false;
        this._conditionalRules = configuration.rules ?? [];
    }
}
```

#### Save Configuration
```typescript
async #saveConfiguration() {
    const configuration = {
        isConditional: this._isConditional,
        rules: this._conditionalRules
    };

    await fetch(`/umbraco/conditionalfields/api/v1/conditionalfieldsconfiguration/${this._currentPropertyKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configuration)
    });
}
```

#### Auto-Save Behavior
The configuration is automatically saved when:
- The "Field is conditional" toggle is changed
- A new rule is added
- A rule is removed
- Any rule field is modified (field, operator, value, logical operator)

## Using Configuration Data at Runtime

### In the Backoffice

To access configuration when rendering property editors in the backoffice:

```csharp
public class YourPropertyEditorController
{
    private readonly IConditionalPropertiesConfigurationService _configService;

    public async Task<IActionResult> SomeAction(Guid propertyTypeKey)
    {
        var config = await _configService.GetConfigurationAsync(propertyTypeKey);

        if (config?.IsConditional == true)
        {
            // Property has conditional rules - apply visibility logic
            foreach (var rule in config.Rules)
            {
                // Evaluate rule.FieldAlias, rule.Operator, rule.Value
            }
        }
    }
}
```

### In the Frontend

For frontend rendering, you'll need to:

1. **Include configuration in the published content type**:
   - Create a value converter or extend the published content type
   - Attach conditional configurations to properties

2. **Client-side evaluation**:
   - Pass configurations to JavaScript
   - Implement rule evaluation logic
   - Show/hide properties based on field values

Example approach:

```csharp
public class ConditionalPropertiesPublishedContentExtension
{
    private readonly IConditionalPropertiesConfigurationService _configService;

    public async Task<Dictionary<string, PropertyConditionalConfiguration>> GetPageConditionalConfigs(IPublishedContent content)
    {
        var configs = new Dictionary<string, PropertyConditionalConfiguration>();

        foreach (var property in content.ContentType.PropertyTypes)
        {
            var config = await _configService.GetConfigurationAsync(property.Key);
            if (config?.IsConditional == true)
            {
                configs[property.Alias] = config;
            }
        }

        return configs;
    }
}
```

## Database Schema

The configuration is stored in the existing `umbracoKeyValue` table:

| Column | Type | Description |
|--------|------|-------------|
| key | nvarchar(256) | PK, format: `ConditionalProperties.PropertyType.{Guid}` |
| value | nvarchar(max) | JSON-serialized `PropertyConditionalConfiguration` |
| updated | datetime | Last update timestamp (UTC) |

## Performance Considerations

1. **Caching**: Consider implementing a caching layer for frequently accessed configurations
2. **Bulk Loading**: Use `GetAllConfigurationsAsync()` when loading configurations for multiple properties
3. **Lazy Loading**: Only load configurations when needed (e.g., when editing a document type)

## Migration and Cleanup

### Removing Orphaned Configurations

When a property type is deleted, you should clean up its configuration:

```csharp
// Implement a notification handler for property type deletion
public class PropertyTypeDeletingNotificationHandler : INotificationHandler<ContentTypeSavingNotification>
{
    private readonly IConditionalPropertiesConfigurationService _configService;

    public async Task HandleAsync(ContentTypeSavingNotification notification, CancellationToken cancellationToken)
    {
        // Detect deleted property types and clean up configurations
        // (Implementation depends on your specific requirements)
    }
}
```

## Testing

Example test for the configuration service:

```csharp
[Test]
public async Task SaveAndRetrieveConfiguration()
{
    // Arrange
    var propertyTypeKey = Guid.NewGuid();
    var config = new PropertyConditionalConfiguration
    {
        IsConditional = true,
        Rules = new List<ConditionalRule>
        {
            new() { Id = Guid.NewGuid().ToString(), FieldAlias = "test", Operator = ConditionalOperator.Equals, Value = "value" }
        }
    };

    // Act
    await _configService.SaveConfigurationAsync(propertyTypeKey, config);
    var retrieved = await _configService.GetConfigurationAsync(propertyTypeKey);

    // Assert
    Assert.That(retrieved, Is.Not.Null);
    Assert.That(retrieved.IsConditional, Is.True);
    Assert.That(retrieved.Rules.Count, Is.EqualTo(1));
}
```

## Troubleshooting

### Configuration Not Saving
1. Check browser console for API errors
2. Verify the property type has a valid GUID (`_currentPropertyKey`)
3. Check server logs for exceptions in `ConditionalPropertiesConfigurationService`

### Configuration Not Loading
1. Verify the API endpoint is accessible: `/umbraco/conditionalfields/api/v1/conditionalfieldsconfiguration/{guid}`
2. Check the KeyValue table in the database for the expected key
3. Ensure JSON is valid in the `value` column

### Performance Issues
1. Implement caching in `ConditionalPropertiesConfigurationService`
2. Use bulk loading with `GetAllConfigurationsAsync()` instead of individual calls
3. Consider adding database indexes if querying by prefix becomes slow

## Summary

The ConditionalProperties package uses Umbraco's built-in KeyValue storage to persist property-specific conditional rule configurations. This approach:

- Requires no custom database tables or migrations
- Uses standard Umbraco patterns and repositories
- Provides a clean separation between storage and application logic
- Supports both backoffice and frontend scenarios
- Is maintainable and upgrade-safe

The implementation follows Umbraco best practices with proper dependency injection, async/await patterns, error handling, and logging.
