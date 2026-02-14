using ConditionalProperties.Models;
using uSync.Core.Serialization;
using uSync.Core.Tracking;

namespace ConditionalProperties.uSync.Trackers
{
    internal class CdDefinitionTracker : SyncXmlTrackAndMerger<CdConfigurationDefinition>, ISyncTracker<CdConfigurationDefinition>
    {
        public CdDefinitionTracker(SyncSerializerCollection serializers) : base(serializers)
        {
        }

        public override List<TrackingItem> TrackingItems =>
        [
            TrackingItem.Single(nameof(CdConfigurationDefinition.Configuration.IsConditional),  $"Details/{nameof(CdConfigurationDefinition.Configuration.IsConditional)}"),
            TrackingItem.Single(nameof(CdConfigurationDefinition.Configuration.Rules),  $"Details/{nameof(CdConfigurationDefinition.Configuration.Rules)}"),
            TrackingItem.Many("Rules", "Rules/Rule","Value")
        ];
    }
}
