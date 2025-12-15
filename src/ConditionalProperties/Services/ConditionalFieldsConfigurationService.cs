using System.Text.Json;
using ConditionalProperties.Models;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Services;

namespace ConditionalProperties.Services;

/// <summary>
/// Service for managing conditional field configurations using Umbraco's KeyValue store
/// </summary>
public class ConditionalPropertiesConfigurationService : IConditionalPropertiesConfigurationService
{
    private const string KeyPrefix = "ConditionalProperties.PropertyType.";

    private readonly IKeyValueService _keyValueService;
    private readonly ILogger<ConditionalPropertiesConfigurationService> _logger;

    public ConditionalPropertiesConfigurationService(
        IKeyValueService keyValueService,
        ILogger<ConditionalPropertiesConfigurationService> logger)
    {
        _keyValueService = keyValueService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<PropertyConditionalConfiguration?> GetConfigurationAsync(Guid propertyTypeKey)
    {
        try
        {
            var key = GetKey(propertyTypeKey);
            var value = _keyValueService.GetValue(key);

            if (string.IsNullOrEmpty(value))
            {
                return null;
            }

            var configuration = JsonSerializer.Deserialize<PropertyConditionalConfiguration>(value);
            return await Task.FromResult(configuration);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving conditional configuration for property type {PropertyTypeKey}", propertyTypeKey);
            return null;
        }
    }

    /// <inheritdoc />
    public async Task SaveConfigurationAsync(Guid propertyTypeKey, PropertyConditionalConfiguration configuration)
    {
        try
        {
            var key = GetKey(propertyTypeKey);
            var json = JsonSerializer.Serialize(configuration);

            _keyValueService.SetValue(key, json);

            _logger.LogInformation("Saved conditional configuration for property type {PropertyTypeKey}", propertyTypeKey);
            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving conditional configuration for property type {PropertyTypeKey}", propertyTypeKey);
            throw;
        }
    }

    /// <inheritdoc />
    public async Task DeleteConfigurationAsync(Guid propertyTypeKey)
    {
        try
        {
            var key = GetKey(propertyTypeKey);
            var existingValue = _keyValueService.GetValue(key);

            if (!string.IsNullOrEmpty(existingValue))
            {
                // Set to empty string to effectively delete
                _keyValueService.SetValue(key, string.Empty);
                _logger.LogInformation("Deleted conditional configuration for property type {PropertyTypeKey}", propertyTypeKey);
            }

            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting conditional configuration for property type {PropertyTypeKey}", propertyTypeKey);
            throw;
        }
    }

    /// <inheritdoc />
    public async Task<Dictionary<Guid, PropertyConditionalConfiguration>> GetAllConfigurationsAsync()
    {
        try
        {
            var allKeyValues = _keyValueService.FindByKeyPrefix(KeyPrefix);
            var configurations = new Dictionary<Guid, PropertyConditionalConfiguration>();

            if (allKeyValues != null)
            {
                foreach (var kvp in allKeyValues)
                {
                    if (string.IsNullOrEmpty(kvp.Value)) continue;

                    // Extract the property type key from the key
                    var keyPart = kvp.Key.Replace(KeyPrefix, string.Empty);
                    if (Guid.TryParse(keyPart, out var propertyTypeKey))
                    {
                        var configuration = JsonSerializer.Deserialize<PropertyConditionalConfiguration>(kvp.Value);
                        if (configuration != null)
                        {
                            configurations[propertyTypeKey] = configuration;
                        }
                    }
                }
            }

            return await Task.FromResult(configurations);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all conditional configurations");
            return new Dictionary<Guid, PropertyConditionalConfiguration>();
        }
    }

    /// <summary>
    /// Generates the KeyValue storage key for a property type
    /// </summary>
    private static string GetKey(Guid propertyTypeKey) => $"{KeyPrefix}{propertyTypeKey}";
}
