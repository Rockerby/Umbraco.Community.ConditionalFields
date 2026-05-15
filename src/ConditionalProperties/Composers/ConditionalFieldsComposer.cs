using ConditionalProperties.Services;
using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;

namespace ConditionalProperties.Composers;

/// <summary>
/// Composer for registering ConditionalProperties services
/// </summary>
public class ConditionalPropertiesComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        // Register the configuration service
        builder.Services.AddSingleton<IConditionalPropertiesConfigurationService, ConditionalPropertiesConfigurationService>();
    }
}
