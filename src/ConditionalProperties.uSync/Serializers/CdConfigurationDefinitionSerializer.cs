using System.Xml.Linq;
using ConditionalProperties.Models;
using ConditionalProperties.Services;
using ConditionalProperties.uSync.Extensions;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Services;
using Umbraco.Extensions;
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

        public override async Task<CdConfigurationDefinition?> FindItemAsync(string alias) => null;

        public override string ItemAlias(CdConfigurationDefinition item)
        {
            // get the document type alias using the property type key
            var contentType = _contentTypeService.GetAll().FirstOrDefault(ct => ct.PropertyTypes.Any(pt => pt.Key == item.PropertyTypeKey)  );

            if(contentType is null)
            {
                return item.PropertyTypeKey.ToString();
            }

            return contentType.Alias + "_" + contentType.PropertyTypes.First(pt => pt.Key == item.PropertyTypeKey).Alias;
        }

        public override Guid ItemKey(CdConfigurationDefinition item)
        {
            return item.PropertyTypeKey;
        }

        public override async Task SaveItemAsync(CdConfigurationDefinition item)
        {
            await _conditionalPropertiesConfigurationService.SaveConfigurationAsync(item.PropertyTypeKey, item.Configuration);
        }

        protected override async Task<SyncAttempt<CdConfigurationDefinition>> DeserializeCoreAsync(XElement node, SyncSerializerOptions options)
        {
            var key = node.GetKey();


            // get the document type using a property type wit the provided key.
            var contentType = _contentTypeService.GetAll().FirstOrDefault(ct => ct.PropertyTypes.Any(pt => pt.Key == key));


            if (contentType is null)
            {
                return SyncAttempt<CdConfigurationDefinition>.Fail(node.GetAlias(), ChangeType.ImportFail, "Could not find property type for the provided key.");
            }

            var detailsNode = node.Element("Details");

            if (detailsNode is null)
            {
                return SyncAttempt<CdConfigurationDefinition>.Fail(node.GetAlias(), ChangeType.ImportFail, "No Details node");
            }

            var cdDefconfiguration = new PropertyConditionalConfiguration
            {
                IsConditional = detailsNode.Element("IsConditional").ValueOrDefault(false)
            };

            var rulesNode = detailsNode.Element("Rules");
            if (rulesNode is null)
            {
                return SyncAttempt<CdConfigurationDefinition>.Fail(node.GetAlias(), ChangeType.ImportFail, "No Details node");
            }

            foreach (var ruleNode in rulesNode.Elements("Rule"))
            {
                var rule = new ConditionalRule
                {
                    Id = ruleNode.Element("Id").ValueOrDefault(string.Empty),
                    Operator = ruleNode.Element("Operator") is null ? ConditionalOperator.Equals
                                                                    : ruleNode.Element("Operator")!.GetEnumValue<ConditionalOperator>("Operator"),
                    Value = ruleNode.Element("Value").ValueOrDefault(string.Empty),
                    LogicalOperator = ruleNode.Element("LogicalOperator")?.GetEnumValue<LogicalOperator>("LogicalOperator"),
                    FieldAlias = ruleNode.Element("RuleAlias").ValueOrDefault(string.Empty)
                };

                cdDefconfiguration.Rules.Add(rule);
            }

            var cDDefinition = new CdConfigurationDefinition(key, cdDefconfiguration);

            return SyncAttempt<CdConfigurationDefinition>.Succeed(node.GetAlias(), cDDefinition, ChangeType.Import, []);
        }

        protected override Task<SyncAttempt<XElement>> SerializeCoreAsync(CdConfigurationDefinition item, SyncSerializerOptions options)
        {
            var alias = ItemAlias(item);

            var node = new XElement(ItemType,
                new XAttribute("Key", item.PropertyTypeKey.ToString()),
                new XAttribute("Alias", alias));

            var details = new XElement("Details", new XElement("IsConditional", item.Configuration.IsConditional));

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


            details.Add(rules);
            node.Add(details);

            return Task.FromResult(SyncAttempt<XElement>.Succeed(alias, node, ChangeType.Export, []));
        }

    }
}
