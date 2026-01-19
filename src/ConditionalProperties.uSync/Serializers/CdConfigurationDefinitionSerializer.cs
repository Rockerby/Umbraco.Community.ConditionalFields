using System.Xml.Linq;
using ConditionalProperties.Models;
using ConditionalProperties.Services;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Services;
using uSync.Core;
using uSync.Core.Models;
using uSync.Core.Serialization;

namespace ConditionalProperties.uSync.Serializers
{
    [SyncSerializer("7870b388-2a71-454e-a8be-205aeccb6593", "Conditional Displayers Serializer", "ConditionalDisplayers")]
    public class CdConfigurationDefinitionSerializer : SyncSerializerRoot<CdConfigurationDefinition>, ISyncSerializer<CdConfigurationDefinition>
    {
        private readonly IConditionalPropertiesConfigurationService _conditionalPropertiesConfigurationService;
        private readonly IPropertyTypeUsageService _propertyTypeUsageService;
        private readonly IContentTypeService _contentTypeService;

        public CdConfigurationDefinitionSerializer(
            ILogger<CdConfigurationDefinitionSerializer> logger,
            IConditionalPropertiesConfigurationService conditionalPropertiesConfigurationService,
            IPropertyTypeUsageService propertyTypeUsageService,
            IContentTypeService contentTypeService) : base(logger)
        {
            _conditionalPropertiesConfigurationService = conditionalPropertiesConfigurationService;
            _propertyTypeUsageService = propertyTypeUsageService;
            _contentTypeService = contentTypeService;
        }

        public override async Task DeleteItemAsync(CdConfigurationDefinition item)
        {
            await _conditionalPropertiesConfigurationService.DeleteConfigurationAsync(item.PropertyTypeKey);
        }

        public override async Task<CdConfigurationDefinition?> FindItemAsync(Guid key)
        {
            var configuration = await _conditionalPropertiesConfigurationService.GetConfigurationAsync(key);
            if (configuration is not null)
            {
                return new CdConfigurationDefinition(key, configuration);
            }

            return null;
        }

        public override async Task<CdConfigurationDefinition?> FindItemAsync(string alias)
        {
            // Resolve property type key by scanning all content types for a property type with this alias.
            var propertyTypeKey = ResolvePropertyTypeKeyByAlias(alias);
            if (propertyTypeKey == Guid.Empty)
            {
                return null;
            }

            var configuration = await _conditionalPropertiesConfigurationService.GetConfigurationAsync(propertyTypeKey);
            if (configuration is null)
            {
                return null;
            }

            return new CdConfigurationDefinition(propertyTypeKey, configuration);
        }

        public override string ItemAlias(CdConfigurationDefinition item)
        {
            // Find the alias for this property type key for readability and import matching.
            var alias = ResolvePropertyTypeAliasByKey(item.PropertyTypeKey);
            return string.IsNullOrWhiteSpace(alias) ? item.PropertyTypeKey.ToString() : alias;
        }

        public override Guid ItemKey(CdConfigurationDefinition item)
        {
            return item.PropertyTypeKey;
        }

        public override async Task SaveItemAsync(CdConfigurationDefinition item)
        {
            await _conditionalPropertiesConfigurationService.SaveConfigurationAsync(item.PropertyTypeKey, item.Configuration);
        }

        protected override Task<SyncAttempt<CdConfigurationDefinition>> DeserializeCoreAsync(XElement node, SyncSerializerOptions options)
        {
            throw new NotImplementedException();
        }

        protected override Task<SyncAttempt<XElement>> SerializeCoreAsync(CdConfigurationDefinition item, SyncSerializerOptions options)
        {
            var alias = ItemAlias(item);

            var node = new XElement(ItemType,
                new XAttribute("Key", item.PropertyTypeKey.ToString()),
                new XAttribute("Alias", alias));

            var rules = new XElement("Rules");
            foreach (var rule in item.Configuration.Rules)
            {
                var ruleXElement = new XElement("Rule",
                    new XElement("Id", rule.Id),                    
                    new XElement("Operator", rule.Operator),
                    new XElement("Value", rule.Value),
                    new XElement("LogicalOperator", rule.LogicalOperator),
                    new XElement("RuleAlias", rule.FieldAlias));

                rules.Add(ruleXElement);
            }

            var info = new XElement("Details", new XElement("IsConditional", item.Configuration.IsConditional));

            info.Add(rules);
            node.Add(info);

            return Task.FromResult(SyncAttempt<XElement>.Succeed(alias, node, ChangeType.Export, []));
        }

        private Guid ResolvePropertyTypeKeyByAlias(string alias)
        {
            // Enumerate all content types and look for a property type with the given alias.
            // Note: property type aliases are unique within a content type, so this scans globally.
            var allContentTypes = _contentTypeService.GetAll();
            foreach (var ct in allContentTypes)
            {
                foreach (var pt in ct.PropertyTypes)
                {
                    if (string.Equals(pt.Alias, alias, StringComparison.OrdinalIgnoreCase))
                    {
                        return pt.Key;
                    }
                }
            }
            return Guid.Empty;
        }

        private string? ResolvePropertyTypeAliasByKey(Guid propertyTypeKey)
        {
            var allContentTypes = _contentTypeService.GetAll();
            foreach (var ct in allContentTypes)
            {
                foreach (var pt in ct.PropertyTypes)
                {
                    if (pt.Key == propertyTypeKey)
                    {
                        return pt.Alias;
                    }
                }
            }
            return null;
        }

    }
}
