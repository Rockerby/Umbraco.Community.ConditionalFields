namespace ConditionalFields.Models;

/// <summary>
/// Represents a conditional rule for showing/hiding a property
/// </summary>
public class ConditionalRule
{
    /// <summary>
    /// Unique identifier for the rule
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Alias of the field to evaluate
    /// </summary>
    public string FieldAlias { get; set; } = string.Empty;

    /// <summary>
    /// The operator to use for comparison
    /// </summary>
    public ConditionalOperator Operator { get; set; }

    /// <summary>
    /// The value to compare against
    /// </summary>
    public string Value { get; set; } = string.Empty;

    /// <summary>
    /// Logical operator to combine with the next rule (AND/OR)
    /// </summary>
    public LogicalOperator? LogicalOperator { get; set; }
}

/// <summary>
/// Operators for conditional comparisons
/// </summary>
public enum ConditionalOperator
{
    Equals,
    NotEquals,
    Contains,
    NotContains,
    GreaterThan,
    LessThan,
    IsEmpty,
    IsNotEmpty
}

/// <summary>
/// Logical operators for combining rules
/// </summary>
public enum LogicalOperator
{
    And,
    Or
}
