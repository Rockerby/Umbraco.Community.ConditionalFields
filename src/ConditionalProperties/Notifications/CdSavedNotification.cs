using ConditionalProperties.Models;
using Umbraco.Cms.Core.Notifications;

namespace ConditionalProperties.Notifications
{
    public class CdSavedNotification : INotification
    {
        public CdSavedNotification(Guid propertyTypeKey, PropertyConditionalConfiguration configuration)
        {
            PropertyTypeKey = propertyTypeKey;
            Configuration = configuration;
        }

        public Guid PropertyTypeKey { get; set; }
        public PropertyConditionalConfiguration Configuration { get; set; } = new();
    }
}
