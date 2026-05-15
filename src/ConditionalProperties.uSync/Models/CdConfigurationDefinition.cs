namespace ConditionalProperties.Models
{
    /// <summary>
    /// Stores the definition of a conditional display configuration for a property type so it can be serialised by uSync
    /// </summary>
    public class CdConfigurationDefinition
    {
        public CdConfigurationDefinition(Guid propertyTypeKey, PropertyConditionalConfiguration configuration)
        {
            PropertyTypeKey = propertyTypeKey;
            Configuration = configuration;
        }

        public Guid PropertyTypeKey { get; set; }
        public PropertyConditionalConfiguration Configuration { get; set; } = new();
    }
}
