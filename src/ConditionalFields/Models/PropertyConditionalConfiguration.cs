namespace ConditionalFields.Models;

/// <summary>
/// Configuration for conditional visibility of a property
/// </summary>
public class PropertyConditionalConfiguration
{
    /// <summary>
    /// Indicates whether conditional rules are enabled for this property
    /// </summary>
    public bool IsConditional { get; set; }

    /// <summary>
    /// The list of conditional rules
    /// </summary>
    public List<ConditionalRule> Rules { get; set; } = new();
}
