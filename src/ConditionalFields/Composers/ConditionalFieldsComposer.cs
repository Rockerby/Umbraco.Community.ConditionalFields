using ConditionalFields.Services;
using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;

namespace ConditionalFields.Composers;

/// <summary>
/// Composer for registering ConditionalFields services
/// </summary>
public class ConditionalFieldsComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        // Register the configuration service
        builder.Services.AddSingleton<IConditionalFieldsConfigurationService, ConditionalFieldsConfigurationService>();
    }
}
