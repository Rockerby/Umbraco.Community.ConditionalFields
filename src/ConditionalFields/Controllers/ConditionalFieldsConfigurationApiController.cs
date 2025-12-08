using Asp.Versioning;
using ConditionalFields.Models;
using ConditionalFields.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Core.Security;

namespace ConditionalFields.Controllers;

/// <summary>
/// API controller for managing conditional field configurations
/// </summary>
[ApiVersion("1.0")]
public class ConditionalFieldsConfigurationApiController : ConditionalFieldsApiControllerBase
{
    private readonly IConditionalFieldsConfigurationService _configurationService;
    private readonly IBackOfficeSecurityAccessor _backOfficeSecurityAccessor;

    public ConditionalFieldsConfigurationApiController(
        IConditionalFieldsConfigurationService configurationService,
        IBackOfficeSecurityAccessor backOfficeSecurityAccessor)
    {
        _configurationService = configurationService;
        _backOfficeSecurityAccessor = backOfficeSecurityAccessor;
    }

    /// <summary>
    /// Gets the conditional configuration for a specific property type
    /// </summary>
    /// <param name="propertyTypeKey">The unique identifier of the property type</param>
    /// <returns>The conditional configuration</returns>
    [HttpGet("{propertyTypeKey:guid}")]
    [MapToApiVersion("1.0")]
    [ProducesResponseType<PropertyConditionalConfiguration>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetConfiguration(Guid propertyTypeKey)
    {
        var configuration = await _configurationService.GetConfigurationAsync(propertyTypeKey);

        if (configuration == null)
        {
            // Return a default empty configuration if none exists
            return Ok(new PropertyConditionalConfiguration
            {
                IsConditional = false,
                Rules = new List<ConditionalRule>()
            });
        }

        return Ok(configuration);
    }

    /// <summary>
    /// Saves the conditional configuration for a specific property type
    /// </summary>
    /// <param name="propertyTypeKey">The unique identifier of the property type</param>
    /// <param name="configuration">The configuration to save</param>
    /// <returns>Success response</returns>
    [HttpPost("{propertyTypeKey:guid}")]
    [MapToApiVersion("1.0")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SaveConfiguration(
        Guid propertyTypeKey,
        [FromBody] PropertyConditionalConfiguration configuration)
    {
        if (configuration == null)
        {
            return BadRequest("Configuration cannot be null");
        }

        await _configurationService.SaveConfigurationAsync(propertyTypeKey, configuration);

        return Ok(new { message = "Configuration saved successfully" });
    }

    /// <summary>
    /// Deletes the conditional configuration for a specific property type
    /// </summary>
    /// <param name="propertyTypeKey">The unique identifier of the property type</param>
    /// <returns>Success response</returns>
    [HttpDelete("{propertyTypeKey:guid}")]
    [MapToApiVersion("1.0")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteConfiguration(Guid propertyTypeKey)
    {
        await _configurationService.DeleteConfigurationAsync(propertyTypeKey);

        return Ok(new { message = "Configuration deleted successfully" });
    }

    /// <summary>
    /// Gets all property types with conditional configurations
    /// </summary>
    /// <returns>Dictionary of property type keys to configurations</returns>
    [HttpGet("all")]
    [MapToApiVersion("1.0")]
    [ProducesResponseType<Dictionary<Guid, PropertyConditionalConfiguration>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllConfigurations()
    {
        var configurations = await _configurationService.GetAllConfigurationsAsync();
        return Ok(configurations);
    }
}
