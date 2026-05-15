using ConditionalProperties.Notifications;
using ConditionalProperties.uSync.Handlers;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;

namespace ConditionalProperties.uSync
{
    internal class Composer : IComposer
    {
        public void Compose(IUmbracoBuilder builder)
        {
            builder.AddNotificationAsyncHandler<CdSavedNotification, CdConfigurationDefinitionHandler>();
        }
    }
}
