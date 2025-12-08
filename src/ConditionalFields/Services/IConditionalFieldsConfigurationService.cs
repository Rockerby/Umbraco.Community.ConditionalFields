using ConditionalFields.Models;

namespace ConditionalFields.Services;

/// <summary>
/// Service for managing conditional field configurations
/// </summary>
public interface IConditionalFieldsConfigurationService
{
    /// <summary>
    /// Gets the conditional configuration for a specific property type
    /// </summary>
    /// <param name="propertyTypeKey">The unique identifier of the property type</param>
    /// <returns>The conditional configuration, or null if not found</returns>
    Task<PropertyConditionalConfiguration?> GetConfigurationAsync(Guid propertyTypeKey);

    /// <summary>
    /// Saves the conditional configuration for a specific property type
    /// </summary>
    /// <param name="propertyTypeKey">The unique identifier of the property type</param>
    /// <param name="configuration">The configuration to save</param>
    Task SaveConfigurationAsync(Guid propertyTypeKey, PropertyConditionalConfiguration configuration);

    /// <summary>
    /// Deletes the conditional configuration for a specific property type
    /// </summary>
    /// <param name="propertyTypeKey">The unique identifier of the property type</param>
    Task DeleteConfigurationAsync(Guid propertyTypeKey);

    /// <summary>
    /// Gets all property type keys that have conditional configurations
    /// </summary>
    /// <returns>Dictionary of property type keys to their configurations</returns>
    Task<Dictionary<Guid, PropertyConditionalConfiguration>> GetAllConfigurationsAsync();
}
